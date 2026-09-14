package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.LetterDelivery;
import java.time.LocalDateTime;

public record DeliveryResponse(
        Long id,
        String trackingNumber,
        String status,
        String deliveryPersonName,
        String organizationName,
        String recipientName,
        String recipientTitle,
        String subject,
        String referenceNumber,
        LocalDateTime deliveredAt,
        LocalDateTime receivedAt,
        String receivedBy) {

    public static DeliveryResponse full(LetterDelivery delivery) {
        return new DeliveryResponse(
            delivery.getId(),
            delivery.getTrackingNumber(),
            delivery.getStatus().name(),
            delivery.getDeliveryPersonName(),
            delivery.getOrganizationName(),
            delivery.getRecipientName(),
            delivery.getRecipientTitle(),
            delivery.getSubject(),
            delivery.getReferenceNumber(),
            delivery.getDeliveredAt(),
            delivery.getReceivedAt(),
            delivery.getReceivedBy() == null ? null : delivery.getReceivedBy().getDisplayName());
    }

    public static DeliveryResponse publicView(LetterDelivery delivery) {
        return new DeliveryResponse(
            null,
            delivery.getTrackingNumber(),
            delivery.getStatus().name(),
            null,
            null,
            delivery.getRecipientName(),
            delivery.getRecipientTitle(),
            null,
            null,
            delivery.getDeliveredAt(),
            delivery.getReceivedAt(),
            null);
    }
}
