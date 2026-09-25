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

    List<LetterDelivery> findTop100ByStatusOrderByReceivedAtDesc(DeliveryStatus status);

    List<LetterDelivery> findTop20ByOrderByDeliveredAtDesc();

    long countByStatus(DeliveryStatus status);

    long countByDeliveredAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatusAndReceivedAtBetween(DeliveryStatus status, LocalDateTime start, LocalDateTime end);

    Page<LetterDelivery> findByStatus(DeliveryStatus status, Pageable pageable);

    @Query("""
        select d from LetterDelivery d
        where d.deliveryPersonName = :personName
          and d.organizationName = :orgName
          and d.recipientName = :recipientName
          and d.subject = :subject
          and d.deliveredAt > :threshold
        order by d.deliveredAt desc
        """)
    Optional<LetterDelivery> findFirstByDeliveryPersonNameAndOrganizationNameAndRecipientNameAndSubjectAndDeliveredAtAfter(
        @Param("personName") String personName,
        @Param("orgName") String orgName,
        @Param("recipientName") String recipientName,
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
          and (:dateFrom is null or d.deliveredAt >= :dateFrom)
          and (:dateTo is null or d.deliveredAt <= :dateTo)
        order by d.deliveredAt desc
        """)
    Page<LetterDelivery> searchWithDateFilter(
        @Param("status") DeliveryStatus status,
        @Param("q") String q,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo,
        Pageable pageable);

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
          and (:recipientPosition is null or :recipientPosition = '' or lower(d.recipientName) = lower(:recipientPosition))
          and (:organization is null or :organization = '' or lower(d.organizationName) = lower(:organization))
          and (:dateFrom is null or d.deliveredAt >= :dateFrom)
          and (:dateTo is null or d.deliveredAt <= :dateTo)
        order by d.deliveredAt desc
        """)
    Page<LetterDelivery> searchWithFilters(
        @Param("status") DeliveryStatus status,
        @Param("q") String q,
        @Param("recipientPosition") String recipientPosition,
        @Param("organization") String organization,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo,
        Pageable pageable);
}
