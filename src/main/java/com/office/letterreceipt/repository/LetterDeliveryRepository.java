package com.office.letterreceipt.repository;

import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.model.Organization;
import com.office.letterreceipt.model.Recipient;
import com.office.letterreceipt.model.DeliveryPerson;
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

    List<LetterDelivery> findTop100ByStatusOrderByReceivedAtDesc(DeliveryStatus status);

    List<LetterDelivery> findTop20ByOrderByDeliveredAtDesc();

    long countByStatus(DeliveryStatus status);

    long countByDeliveredAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusAndReceivedAtBetween(DeliveryStatus status, LocalDateTime start, LocalDateTime end);

    @Query("""
        select d from LetterDelivery d
        where d.deliveryPerson = :person
          and d.organization = :organization
          and d.recipient = :recipient
          and d.subject = :subject
          and d.deliveredAt > :threshold
        order by d.deliveredAt desc
        """)
    Optional<LetterDelivery> findFirstByDeliveryPersonAndOrganizationAndRecipientAndSubjectAndDeliveredAtAfter(
        @Param("person") DeliveryPerson person,
        @Param("organization") Organization organization,
        @Param("recipient") Recipient recipient,
        @Param("subject") String subject,
        @Param("threshold") LocalDateTime threshold);

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
