package com.soberity.evidence.blog;

import com.soberity.evidence.domain.EvidencePolicy;
import java.util.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

/** Canonical Tiptap document. Arbitrary HTML, script and external images are never persisted. */
public final class BlogDocument {
    private BlogDocument() { }
    private static final Set<String> NODES=Set.of("doc","paragraph","heading","bulletList","orderedList","listItem","blockquote","hardBreak","horizontalRule","text","image");
    public record Checked(JsonNode document,Set<UUID> images,String text) { }
    public static Checked check(JsonNode input) {
        Set<UUID> images=new HashSet<>();StringBuilder text=new StringBuilder();int[] count={0};
        if(input==null || !"doc".equals(input.path("type").asText()))throw new IllegalArgumentException("Document required");
        JsonNode doc=node(input,0,count,images,text);
        if(text.length()>100000)throw new IllegalArgumentException("Document too large");
        return new Checked(doc,images,text.toString());
    }
    private static JsonNode node(JsonNode n,int depth,int[] count,Set<UUID> images,StringBuilder text) {
        if(depth>20 || ++count[0]>10000)throw new IllegalArgumentException("Document too complex");
        String type=n.path("type").asText();if(!NODES.contains(type))throw new IllegalArgumentException("Unsupported content");
        if(depth>0 && type.equals("doc"))throw new IllegalArgumentException("Invalid document structure");
        ObjectNode out=JsonNodeFactory.instance.objectNode();out.put("type",type);
        if(type.equals("text")) {String value=n.path("text").asText();text.append(value);out.put("text",value);}
        if(n.has("attrs")) {
            var attrs=out.putObject("attrs");var a=n.get("attrs");
            if(type.equals("heading")) {int level=a.path("level").asInt(2);if(level<1||level>3)throw new IllegalArgumentException("Invalid heading");attrs.put("level",level);}
            if(type.equals("paragraph")||type.equals("heading")) {
                String align=a.path("textAlign").asText("left");if(!Set.of("left","center","right","justify").contains(align))align="left";attrs.put("textAlign",align);
            }
            if(type.equals("orderedList"))attrs.put("start",Math.max(1,Math.min(10000,a.path("start").asInt(1))));
            if(type.equals("image")) {
                String src=a.path("src").asText();String prefix="/api/v1/science/media/";
                if(!src.startsWith(prefix))throw new IllegalArgumentException("Upload image first");
                UUID id=UUID.fromString(src.substring(prefix.length()));images.add(id);
                String alt=a.path("alt").asText();if(alt.isBlank()||alt.length()>500)throw new IllegalArgumentException("Image description required");
                attrs.put("src",prefix+id);attrs.put("alt",alt);
            }
        }
        if(type.equals("image")&&!out.has("attrs"))throw new IllegalArgumentException("Image missing asset");
        if(n.has("marks")) {
            var marks=out.putArray("marks");if(!n.get("marks").isArray()||n.get("marks").size()>8)throw new IllegalArgumentException("Invalid marks");
            for(var mark:n.get("marks")) {
                String m=mark.path("type").asText();if(!Set.of("bold","italic","underline","strike","code","link").contains(m))throw new IllegalArgumentException("Invalid mark");
                var value=marks.addObject();value.put("type",m);
                if(m.equals("link")) {var attrs=value.putObject("attrs");attrs.put("href",EvidencePolicy.httpsUrl(mark.path("attrs").path("href").asText()));attrs.put("target","_blank");attrs.put("rel","noopener noreferrer");}
            }
        }
        if(n.has("content")) {
            if(!n.get("content").isArray())throw new IllegalArgumentException("Invalid content");
            var children=out.putArray("content");for(var c:n.get("content"))children.add(node(c,depth+1,count,images,text));
        }
        return out;
    }
}
