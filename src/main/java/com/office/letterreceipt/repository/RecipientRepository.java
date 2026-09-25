package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.Recipient;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
public interface RecipientRepository extends JpaRepository<Recipient,Long>{
    List<Recipient> findByActiveTrueOrderByFullNameAsc();
    List<Recipient> findAllByOrderByFullNameAsc();
    Optional<Recipient> findByFullNameIgnoreCase(String fullName);
    Optional<Recipient> findByJobTitleIgnoreCaseAndActiveTrue(String jobTitle);
    
    @Query("SELECT DISTINCT r.jobTitle FROM Recipient r WHERE r.active = true AND r.jobTitle IS NOT NULL AND r.jobTitle <> '' ORDER BY r.jobTitle")
    List<String> findDistinctActiveJobTitles();
}
