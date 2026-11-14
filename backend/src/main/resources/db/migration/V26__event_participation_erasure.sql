-- Extend the existing RSVP relation; no duplicate participation table or historical cancellation rows.
CREATE FUNCTION events_erase_participation_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.firebase_uid,0));
 DELETE FROM events_interest WHERE user_ref=encode(sha256(convert_to(NEW.firebase_uid,'UTF8')),'hex');
 RETURN NEW;
END $$;
CREATE TRIGGER events_participation_account_erasure BEFORE INSERT ON deleted_account
 FOR EACH ROW EXECUTE FUNCTION events_erase_participation_account();

CREATE FUNCTION events_erase_participation_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status IN ('DELETED','CANCELLED') THEN
  DELETE FROM events_interest WHERE event_id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER events_participation_event_erasure AFTER UPDATE OF status ON sober_event
 FOR EACH ROW EXECUTE FUNCTION events_erase_participation_event();

-- Repair orphaned intents left by V25 before these erasure hooks existed.
DELETE FROM events_interest i USING deleted_account d
 WHERE i.user_ref=encode(sha256(convert_to(d.firebase_uid,'UTF8')),'hex');
DELETE FROM events_interest i USING sober_event e
 WHERE i.event_id=e.id AND e.status IN ('DELETED','CANCELLED');
