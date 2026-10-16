-- V9: Complete schema rebuild for current mobile payload
-- Drops all existing tables and creates new clean schema
-- This migration assumes a fresh database (development reset)

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS delivery_events;
DROP TABLE IF EXISTS letter_deliveries;
DROP TABLE IF EXISTS idempotency_keys;
DROP TABLE IF EXISTS delivery_people;
DROP TABLE IF EXISTS recipients;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS app_users;

-- Flyway baseline table (will be recreated by Flyway)
-- DROP TABLE IF EXISTS flyway_schema_history;

-- ============================================================
-- New clean schema
-- ============================================================

-- Application users (for authentication/authorization)
CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    display_name VARCHAR(160) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Letter deliveries - denormalized schema matching mobile payload
CREATE TABLE letter_deliveries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    -- Unified reference/tracking code (e.g., REF-2026-7K4P92)
    tracking_number VARCHAR(40) NOT NULL,
    -- Delivery person fields (from mobile form)
    delivery_person_name VARCHAR(160) NOT NULL,
    delivery_person_phone VARCHAR(60) NULL,
    delivery_person_email VARCHAR(180) NULL,
    -- Recipient field (from mobile recipient chips)
    -- Single field combining what was previously recipient_name + recipient_title
    recipient_title VARCHAR(160) NULL,
    -- Status and timestamps
    status VARCHAR(30) NOT NULL,
    delivered_at DATETIME(6) NOT NULL,
    received_at DATETIME(6) NULL,
    received_by_user_id BIGINT NULL,
    -- Audit fields
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_delivery_tracking UNIQUE (tracking_number),
    CONSTRAINT fk_delivery_received_by FOREIGN KEY (received_by_user_id) REFERENCES app_users(id),
    INDEX idx_delivery_status_time (status, delivered_at),
    INDEX idx_delivery_delivered_at (delivered_at),
    INDEX idx_delivery_received_at (received_at),
    INDEX idx_delivery_tracking_number (tracking_number),
    INDEX idx_delivery_person_name (delivery_person_name),
    INDEX idx_delivery_recipient_title (recipient_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery events (audit trail)
CREATE TABLE delivery_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    delivery_id BIGINT NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    actor_name VARCHAR(160) NOT NULL,
    remarks VARCHAR(500) NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(500) NULL,
    event_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_event_delivery FOREIGN KEY (delivery_id) REFERENCES letter_deliveries(id),
    INDEX idx_event_delivery_time (delivery_id, event_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotency keys (for duplicate delivery prevention)
CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(64) NOT NULL,
    tracking_number VARCHAR(40) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (idempotency_key),
    INDEX idx_idempotency_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;