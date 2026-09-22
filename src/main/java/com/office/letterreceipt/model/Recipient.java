package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="recipients", indexes={@Index(name="idx_recipient_name", columnList="full_name"), @Index(name="idx_recipient_active", columnList="active")})
public class Recipient {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="full_name", nullable=false, length=160) private String fullName;
    @Column(name="job_title", length=160) private String jobTitle;
    @Column(length=160) private String department;
    @Column(nullable=false) private boolean active=true;
    @CreatedDate @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @LastModifiedDate @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getFullName(){return fullName;} public void setFullName(String v){this.fullName=v;}
    public String getJobTitle(){return jobTitle;} public void setJobTitle(String v){this.jobTitle=v;}
    public String getDepartment(){return department;} public void setDepartment(String v){this.department=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){this.active=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
    @Transient public String getDisplayName(){ return fullName + (jobTitle!=null && !jobTitle.isBlank() ? " — "+jobTitle : ""); }
}
