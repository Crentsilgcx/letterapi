package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.DeliveryPerson;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DeliveryPersonRepository extends JpaRepository<DeliveryPerson,Long>{
    List<DeliveryPerson> findTop20ByActiveTrueAndFullNameContainingIgnoreCaseOrderByFullNameAsc(String q);
    List<DeliveryPerson> findTop100ByActiveTrueOrderByFullNameAsc();
}
