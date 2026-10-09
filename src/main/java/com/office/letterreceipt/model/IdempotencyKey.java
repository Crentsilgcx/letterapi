package com.office.letterreceipt.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {
    @Id
    private String key;

    private String trackingNumber;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    public IdempotencyKey() {}

    public IdempotencyKey(String key, String trackingNumber, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.key = key;
        this.trackingNumber = trackingNumber;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}