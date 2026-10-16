ALTER TABLE letter_deliveries
MODIFY COLUMN delivery_person_id BIGINT NULL,
MODIFY COLUMN organization_id BIGINT NULL,
MODIFY COLUMN recipient_id BIGINT NULL;