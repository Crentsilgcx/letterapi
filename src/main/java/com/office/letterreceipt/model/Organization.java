package com.office.letterreceipt.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name="organizations", uniqueConstraints=@UniqueConstraint(name="uk_org_name", columnNames="name"), indexes=@Index(name="idx_org_name", columnList="name"))
public class Organization {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, length=180) private String name;
    @Column(nullable=false) private boolean active = true;
    @CreatedDate @Column(name="created_at", nullable=false, updatable=false) private LocalDateTime createdAt;
    @LastModifiedDate @Column(name="updated_at", nullable=false) private LocalDateTime updatedAt;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getName(){return name;} public void setName(String name){this.name=name;}
    public boolean isActive(){return active;} public void setActive(boolean active){this.active=active;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
