package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.Organization;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface OrganizationRepository extends JpaRepository<Organization,Long>{
    List<Organization> findByActiveTrueOrderByNameAsc();
    Optional<Organization> findByNameIgnoreCase(String name);
    List<Organization> findAllByOrderByNameAsc();
}
