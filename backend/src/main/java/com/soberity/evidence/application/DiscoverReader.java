package com.soberity.evidence.application;

import com.soberity.evidence.blog.BlogService;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** One paginated public timeline; reuse existing public projections for each content type. */
@Service
@Transactional(readOnly=true, isolation=Isolation.REPEATABLE_READ)
public class DiscoverReader {
    private final JdbcTemplate jdbc;
    private final SciencePublicReader science;
    private final BlogService blogs;
    public DiscoverReader(JdbcTemplate jdbc,SciencePublicReader science,BlogService blogs) {
        this.jdbc=jdbc; this.science=science; this.blogs=blogs;
    }
    public record Item(String type, Map<String,Object> content) { }
    public record Page(List<Item> items,int page,int size,long total) { }
    private static final String TIMELINE="""
        SELECT 'POST' AS type,p.id,v.published_at,v.title,ARRAY[v.category_code] AS categories
        FROM editorial_post p JOIN editorial_post_version v ON v.post_id=p.id
        WHERE v.status='PUBLISHED'
        UNION ALL
        SELECT 'ARTICLE' AS type,a.article_id AS id,a.published_at,a.title,ARRAY[a.category_code] AS categories
        FROM science_article a JOIN claim_revision r ON r.id=a.revision_id
        JOIN evidence_claim c ON c.id=r.claim_id
        WHERE a.status='PUBLISHED' AND r.status='PUBLISHED' AND c.locale=?
        UNION ALL
        SELECT 'CLAIM' AS type,c.id,r.published_at,r.claim_text AS title,
            ARRAY(SELECT cc.category_code FROM science_claim_category cc WHERE cc.claim_id=c.id) AS categories
        FROM evidence_claim c JOIN claim_revision r ON r.claim_id=c.id
        JOIN scientific_review sr ON sr.revision_id=r.id AND sr.decision='APPROVED'
        WHERE r.status='PUBLISHED' AND c.locale=?
        """;
    public Page feed(String locale,int page) {
        return feed(locale,page,20);
    }
    public Page feed(String locale,int page,int size) {
        return feed(locale,page,size,null,null);
    }
    public Page feed(String locale,int page,int size,String query,String category) {
        String search=query==null ? "" : query.strip();
        String categoryFilter=category==null || category.isBlank() ? null : category;
        if(search.length()>200 || (categoryFilter!=null && !categoryFilter.matches("[a-z][a-z0-9-]{0,39}")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid Discover search or category.");
        if((!"en".equals(locale) && !"pl".equals(locale)) || page<0 || page>1000000 || size<1 || size>100)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid Discover language, page or size.");
        String filtered=" FROM ("+TIMELINE+") entries WHERE 1=1";
        var args=new ArrayList<Object>(List.of(locale,locale));
        if(!search.isEmpty()) {
            // Literal substring matching: SQL wildcards in user input have no special meaning.
            filtered+=" AND strpos(lower(title),lower(?))>0";
            args.add(search);
        }
        if(categoryFilter!=null) {
            filtered+=" AND ?=ANY(categories)";
            args.add(categoryFilter);
        }
        long total=jdbc.queryForObject("SELECT count(*)"+filtered,Long.class,args.toArray());
        args.add(size);
        args.add((long)page*size);
        var rows=jdbc.queryForList("SELECT type,id,published_at"+filtered+" ORDER BY published_at DESC,id,type LIMIT ? OFFSET ?",args.toArray());
        var items=new ArrayList<Item>();
        for(var row:rows) {
            String type=row.get("type").toString();
            UUID id=(UUID)row.get("id");
            Map<String,Object> content=switch(type) {
                case "POST" -> blogs.publishedDetail(id);
                case "ARTICLE" -> science.article(id);
                case "CLAIM" -> science.claim(id);
                default -> throw new IllegalStateException("Unexpected Discover material type");
            };
            items.add(new Item(type,content));
        }
        return new Page(items,page,size,total);
    }
}
