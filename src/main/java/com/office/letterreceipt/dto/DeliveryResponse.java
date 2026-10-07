package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.LetterDelivery;
import java.time.LocalDateTime;

public record DeliveryResponse(
        Long id,
        String trackingNumber,
        String status,
        String deliveryPersonName,
        String deliveryPersonPhone,
        String deliveryPersonEmail,
        String organizationName,
        String recipientName,
        String recipientTitle,
        String recipient,
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
            delivery.getDeliveryPersonPhone(),
            delivery.getDeliveryPersonEmail(),
            delivery.getOrganizationName(),
            delivery.getRecipientName(),
            delivery.getRecipientTitle(),
            delivery.getRecipientName(),
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
            null,
            null,
            delivery.getRecipientName(),
            delivery.getRecipientTitle(),
            delivery.getRecipientName(),
            null,
            null,
            delivery.getDeliveredAt(),
            delivery.getReceivedAt(),
            null);
    }
}
