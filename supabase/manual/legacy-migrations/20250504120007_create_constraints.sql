ALTER TABLE reservations ADD CONSTRAINT reservations_no_time_overlap
EXCLUDE USING gist (
  table_id WITH =,
  tstzrange(start_at, end_at) WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show'));
