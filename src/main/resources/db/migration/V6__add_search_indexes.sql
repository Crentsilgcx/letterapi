-- Add indexes for search performance
-- Search queries filter on: trackingNumber, deliveryPersonName, organizationName, recipientName, referenceNumber, subject
-- Filters on: recipientPosition (recipientName), organization (organizationName)
-- Date filtering on: deliveredAt, receivedAt
-- Status filtering with date ranges

CREATE INDEX idx_delivery_tracking_number ON letter_deliveries (tracking_number);
CREATE INDEX idx_delivery_person_name ON letter_deliveries (delivery_person_name);
CREATE INDEX idx_organization_name ON letter_deliveries (organization_name);
CREATE INDEX idx_recipient_name ON letter_deliveries (recipient_name);
CREATE INDEX idx_reference_number ON letter_deliveries (reference_number);
CREATE INDEX idx_subject ON letter_deliveries (subject);
CREATE INDEX idx_status_received_at ON letter_deliveries (status, received_at);
CREATE INDEX idx_delivered_at ON letter_deliveries (delivered_at);
CREATE INDEX idx_received_at ON letter_deliveries (received_at);