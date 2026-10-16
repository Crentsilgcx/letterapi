package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "letter_deliveries", uniqueConstraints = @UniqueConstraint(name = "uk_delivery_tracking", columnNames = "tracking_number"), indexes = {
    @Index(name = "idx_delivery_status_time", columnList = "status,delivered_at"),
    @Index(name = "idx_delivery_delivered_at", columnList = "delivered_at"),
    @Index(name = "idx_delivery_received_at", columnList = "received_at"),
    @Index(name = "idx_delivery_tracking_number", columnList = "tracking_number"),
    @Index(name = "idx_delivery_person_name", columnList = "delivery_person_name"),
    @Index(name = "idx_delivery_recipient_title", columnList = "recipient_title")
})
public class LetterDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private long version;

    // Unified reference/tracking code for the letter (e.g., REF-2026-7K4P92)
    @Column(name = "tracking_number", unique = true, nullable = false, length = 40)
    private String trackingNumber;

    // Delivery person fields (denormalized from mobile payload)
    @Column(name = "delivery_person_name", nullable = false, length = 160)
    private String deliveryPersonName;

    @Column(name = "delivery_person_phone", length = 60)
    private String deliveryPersonPhone;

    @Column(name = "delivery_person_email", length = 180)
    private String deliveryPersonEmail;

    // Recipient field (from mobile recipient chips)
    @Column(name = "recipient_title", length = 160)
    private String recipientTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryStatus status;

    @Column(name = "delivered_at", nullable = false)
    private LocalDateTime deliveredAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "received_by_user_id")
    private UserAccount receivedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long v) { id = v; }
    public long getVersion() { return version; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String v) { trackingNumber = v; }

    public String getDeliveryPersonName() { return deliveryPersonName; }
    public void setDeliveryPersonName(String v) { deliveryPersonName = v; }

    public String getDeliveryPersonPhone() { return deliveryPersonPhone; }
    public void setDeliveryPersonPhone(String v) { deliveryPersonPhone = v; }

    public String getDeliveryPersonEmail() { return deliveryPersonEmail; }
    public void setDeliveryPersonEmail(String v) { deliveryPersonEmail = v; }

    public String getRecipientTitle() { return recipientTitle; }
    public void setRecipientTitle(String v) { recipientTitle = v; }

    // Deprecated - for backward compatibility with existing code
    @Deprecated
    public String getRecipientName() { return recipientTitle; }
    @Deprecated
    public void setRecipientName(String v) { recipientTitle = v; }

    @Deprecated
    public String getReceipt() { return recipientTitle; }

    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus v) { status = v; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime v) { deliveredAt = v; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime v) { receivedAt = v; }

    public UserAccount getReceivedBy() { return receivedBy; }
    public void setReceivedBy(UserAccount v) { receivedBy = v; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}