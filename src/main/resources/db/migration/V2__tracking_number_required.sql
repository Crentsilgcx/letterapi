UPDATE letter_deliveries
SET tracking_number = CONCAT('MIG-', LPAD(id, 12, '0'))
WHERE tracking_number IS NULL;

ALTER TABLE letter_deliveries
    MODIFY tracking_number VARCHAR(40) NOT NULL;
