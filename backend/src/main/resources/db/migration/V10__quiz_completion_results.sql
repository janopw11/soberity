-- Minimal completed-attempt summaries, separate from optional in-progress answer storage.
CREATE TABLE learning_quiz_result (
 firebase_uid varchar(128) NOT NULL,
 quiz_id uuid NOT NULL REFERENCES learning_quiz(id),
 attempt_id varchar(100) NOT NULL CHECK(length(attempt_id) BETWEEN 8 AND 100),
 version integer NOT NULL CHECK(version>0),
 correct_count integer NOT NULL CHECK(correct_count>=0),
 question_count integer NOT NULL CHECK(question_count>0 AND correct_count<=question_count),
 completed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(firebase_uid,quiz_id,attempt_id)
);
CREATE INDEX learning_quiz_result_latest ON learning_quiz_result(firebase_uid,quiz_id,completed_at DESC);
CREATE OR REPLACE FUNCTION erase_learning_progress() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.firebase_uid,0));
 DELETE FROM learning_progress WHERE firebase_uid=NEW.firebase_uid;
 DELETE FROM learning_flashcard_progress WHERE firebase_uid=NEW.firebase_uid;
 DELETE FROM learning_quiz_result WHERE firebase_uid=NEW.firebase_uid;
 RETURN NEW;
END $$;
