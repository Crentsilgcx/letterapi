package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="letter_deliveries", uniqueConstraints=@UniqueConstraint(name="uk_delivery_tracking", columnNames="tracking_number"), indexes={
    @Index(name="idx_delivery_status_time", columnList="status,delivered_at"),
    @Index(name="idx_delivery_reference", columnList="reference_number"),
    @Index(name="idx_delivery_recipient", columnList="recipient_id")
})
public class LetterDelivery {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Version private long version;
    @Column(name="tracking_number", unique=true, nullable=false, length=40) private String trackingNumber;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="delivery_person_id") private DeliveryPerson deliveryPerson;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="organization_id") private Organization organization;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="recipient_id") private Recipient recipient;
    @Column(name="delivery_person_name", nullable=false, length=160) private String deliveryPersonName;
    @Column(name="delivery_person_phone", length=60) private String deliveryPersonPhone;
    @Column(name="delivery_person_email", length=180) private String deliveryPersonEmail;
    @Column(name="organization_name", nullable=false, length=180) private String organizationName;
    @Column(name="organization_address", length=250) private String organizationAddress;
    @Column(name="recipient_name", nullable=false, length=160) private String recipientName;
    @Column(name="recipient_title", length=160) private String recipientTitle;
    @Column(nullable=false, length=250) private String subject;
    @Column(name="reference_number", length=120) private String referenceNumber;
    @Column(columnDefinition="TEXT") private String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30) private DeliveryStatus status;
    @Column(name="delivered_at", nullable=false) private LocalDateTime deliveredAt;
    @Column(name="received_at") private LocalDateTime receivedAt;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="received_by_user_id") private UserAccount receivedBy;
    @CreatedDate @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @LastModifiedDate @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;
    public Long getId(){return id;} public void setId(Long v){id=v;} public long getVersion(){return version;}
    public String getTrackingNumber(){return trackingNumber;} public void setTrackingNumber(String v){trackingNumber=v;}
    public DeliveryPerson getDeliveryPerson(){return deliveryPerson;} public void setDeliveryPerson(DeliveryPerson v){deliveryPerson=v;}
    public Organization getOrganization(){return organization;} public void setOrganization(Organization v){organization=v;}
    public Recipient getRecipient(){return recipient;} public void setRecipient(Recipient v){recipient=v;}
    public String getDeliveryPersonName(){return deliveryPersonName;} public void setDeliveryPersonName(String v){deliveryPersonName=v;}
    public String getDeliveryPersonPhone(){return deliveryPersonPhone;} public void setDeliveryPersonPhone(String v){deliveryPersonPhone=v;}
    public String getDeliveryPersonEmail(){return deliveryPersonEmail;} public void setDeliveryPersonEmail(String v){deliveryPersonEmail=v;}
    public String getOrganizationName(){return organizationName;} public void setOrganizationName(String v){organizationName=v;}
    public String getOrganizationAddress(){return organizationAddress;} public void setOrganizationAddress(String v){organizationAddress=v;}
    public String getRecipientName(){return recipientName;} public void setRecipientName(String v){recipientName=v;}
    public String getRecipientTitle(){return recipientTitle;} public void setRecipientTitle(String v){recipientTitle=v;}
    public String getSubject(){return subject;} public void setSubject(String v){subject=v;}
    public String getReferenceNumber(){return referenceNumber;} public void setReferenceNumber(String v){referenceNumber=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public DeliveryStatus getStatus(){return status;} public void setStatus(DeliveryStatus v){status=v;}
    public LocalDateTime getDeliveredAt(){return deliveredAt;} public void setDeliveredAt(LocalDateTime v){deliveredAt=v;}
    public LocalDateTime getReceivedAt(){return receivedAt;} public void setReceivedAt(LocalDateTime v){receivedAt=v;}
    public UserAccount getReceivedBy(){return receivedBy;} public void setReceivedBy(UserAccount v){receivedBy=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
