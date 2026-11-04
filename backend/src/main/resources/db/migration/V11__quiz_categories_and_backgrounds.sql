-- Presentation metadata is editable without changing immutable questions or saved scores.
ALTER TABLE learning_quiz ADD COLUMN category_code varchar(20) NOT NULL DEFAULT 'alco-facts'
 CHECK(category_code IN ('brain','relationships','alco-facts','sport'));
ALTER TABLE learning_quiz ADD COLUMN cover_id uuid REFERENCES editorial_media(id);
ALTER TABLE learning_quiz ADD COLUMN presentation_version integer NOT NULL DEFAULT 1 CHECK(presentation_version>0);
CREATE INDEX learning_quiz_category_catalog ON learning_quiz(category_code,locale,published_at DESC) WHERE status='PUBLISHED';
