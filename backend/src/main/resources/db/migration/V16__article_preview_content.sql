-- Author-written card preview, versioned and reviewed with the article.
-- Existing articles keep NULL; no body text is copied into a teaser automatically.
ALTER TABLE editorial_post_version ADD COLUMN preview_content varchar(280)
 CHECK(preview_content IS NULL OR (length(btrim(preview_content))>0 AND preview_content=btrim(preview_content)));
