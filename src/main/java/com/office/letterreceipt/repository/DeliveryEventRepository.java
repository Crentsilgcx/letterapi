package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.DeliveryEvent;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DeliveryEventRepository extends JpaRepository<DeliveryEvent,Long>{
    List<DeliveryEvent> findByDeliveryIdOrderByEventAtAsc(Long deliveryId);
}
