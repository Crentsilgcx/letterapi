package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="delivery_people", indexes={@Index(name="idx_delivery_person_name", columnList="full_name"), @Index(name="idx_delivery_person_active", columnList="active")})
public class DeliveryPerson {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="full_name", nullable=false, length=160) private String fullName;
    @Column(length=60) private String phone;
    @Column(length=180) private String email;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="organization_id") private Organization organization;
    @Column(nullable=false) private boolean active=true;
    @CreatedDate @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @LastModifiedDate @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getFullName(){return fullName;} public void setFullName(String v){this.fullName=v;}
    public String getPhone(){return phone;} public void setPhone(String v){this.phone=v;}
    public String getEmail(){return email;} public void setEmail(String v){this.email=v;}
    public Organization getOrganization(){return organization;} public void setOrganization(Organization v){this.organization=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){this.active=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
