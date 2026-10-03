-- Make subject nullable for new deliveries (legacy data keeps existing values)
-- organization_address is already nullable from V4

ALTER TABLE letter_deliveries
MODIFY COLUMN subject VARCHAR(250) NULL;