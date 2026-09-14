package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.Recipient;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RecipientRepository extends JpaRepository<Recipient,Long>{
    List<Recipient> findByActiveTrueOrderBySortOrderAscFullNameAsc();
    List<Recipient> findAllByOrderBySortOrderAscFullNameAsc();
}
