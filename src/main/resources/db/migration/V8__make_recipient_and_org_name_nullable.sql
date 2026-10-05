-- Make recipient_name and organization_name nullable for new deliveries
-- (legacy data keeps existing values)

ALTER TABLE letter_deliveries
MODIFY COLUMN recipient_name VARCHAR(160) NULL,
MODIFY COLUMN organization_name VARCHAR(180) NULL;