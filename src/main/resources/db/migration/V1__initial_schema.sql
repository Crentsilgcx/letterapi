CREATE TABLE organizations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(180) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_org_name UNIQUE (name),
    INDEX idx_org_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recipients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(160) NOT NULL,
    job_title VARCHAR(160) NULL,
    department VARCHAR(160) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 100,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_recipient_name (full_name),
    INDEX idx_recipient_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_people (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(160) NOT NULL,
    phone VARCHAR(60) NULL,
    email VARCHAR(180) NULL,
    organization_id BIGINT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_person_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    INDEX idx_delivery_person_name (full_name),
    INDEX idx_delivery_person_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE letter_deliveries (
    id BIGINT NOT NULL AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    tracking_number VARCHAR(40) NULL,
    delivery_person_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    delivery_person_name VARCHAR(160) NOT NULL,
    delivery_person_phone VARCHAR(60) NULL,
    delivery_person_email VARCHAR(180) NULL,
    organization_name VARCHAR(180) NOT NULL,
    recipient_name VARCHAR(160) NOT NULL,
    recipient_title VARCHAR(160) NULL,
    subject VARCHAR(250) NOT NULL,
    reference_number VARCHAR(120) NULL,
    description TEXT NULL,
    status VARCHAR(30) NOT NULL,
    delivered_at DATETIME(6) NOT NULL,
    received_at DATETIME(6) NULL,
    received_by_user_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_delivery_tracking UNIQUE (tracking_number),
    CONSTRAINT fk_delivery_person FOREIGN KEY (delivery_person_id) REFERENCES delivery_people(id),
    CONSTRAINT fk_delivery_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_delivery_recipient FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    CONSTRAINT fk_delivery_received_by FOREIGN KEY (received_by_user_id) REFERENCES app_users(id),
    INDEX idx_delivery_status_time (status, delivered_at),
    INDEX idx_delivery_reference (reference_number),
    INDEX idx_delivery_recipient (recipient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
