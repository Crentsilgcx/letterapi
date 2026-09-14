package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="delivery_events", indexes=@Index(name="idx_event_delivery_time", columnList="delivery_id,event_at"))
public class DeliveryEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="delivery_id", nullable=false) private LetterDelivery delivery;
    @Enumerated(EnumType.STRING) @Column(name="event_type", nullable=false, length=30) private DeliveryEventType eventType;
    @Column(name="actor_name", nullable=false, length=160) private String actorName;
    @Column(length=500) private String remarks;
    @Column(name="ip_address", length=64) private String ipAddress;
    @Column(name="user_agent", length=500) private String userAgent;
    @Column(name="event_at", nullable=false) private LocalDateTime eventAt;
    public Long getId(){return id;} public LetterDelivery getDelivery(){return delivery;} public void setDelivery(LetterDelivery v){delivery=v;}
    public DeliveryEventType getEventType(){return eventType;} public void setEventType(DeliveryEventType v){eventType=v;}
    public String getActorName(){return actorName;} public void setActorName(String v){actorName=v;}
    public String getRemarks(){return remarks;} public void setRemarks(String v){remarks=v;}
    public String getIpAddress(){return ipAddress;} public void setIpAddress(String v){ipAddress=v;}
    public String getUserAgent(){return userAgent;} public void setUserAgent(String v){userAgent=v;}
    public LocalDateTime getEventAt(){return eventAt;} public void setEventAt(LocalDateTime v){eventAt=v;}
}
