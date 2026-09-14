package com.office.letterreceipt.repository;

import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LetterDeliveryRepository extends JpaRepository<LetterDelivery, Long> {
    Optional<LetterDelivery> findByTrackingNumberIgnoreCase(String trackingNumber);

    boolean existsByTrackingNumberIgnoreCase(String trackingNumber);

    List<LetterDelivery> findTop100ByStatusOrderByDeliveredAtAsc(DeliveryStatus status);

    List<LetterDelivery> findTop20ByOrderByDeliveredAtDesc();

    long countByStatus(DeliveryStatus status);

    long countByDeliveredAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusAndReceivedAtBetween(DeliveryStatus status, LocalDateTime start, LocalDateTime end);

    @Query("""
        select d from LetterDelivery d
        where (:status is null or d.status = :status)
          and (
            :q is null or :q = ''
            or lower(d.trackingNumber) like lower(concat('%', :q, '%'))
            or lower(d.deliveryPersonName) like lower(concat('%', :q, '%'))
            or lower(d.organizationName) like lower(concat('%', :q, '%'))
            or lower(d.recipientName) like lower(concat('%', :q, '%'))
            or lower(coalesce(d.referenceNumber, '')) like lower(concat('%', :q, '%'))
            or lower(d.subject) like lower(concat('%', :q, '%'))
          )
        """)
    Page<LetterDelivery> search(@Param("status") DeliveryStatus status, @Param("q") String q, Pageable pageable);
}
