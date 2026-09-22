package com.office.letterreceipt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDeliveryRequest(
        Long deliveryPersonId,
        @Size(max = 160) String fullName,
        @Size(max = 60) String phone,
        @Email @Size(max = 180) String email,
        Long organizationId,
        @Size(max = 180) String organizationName,
        @NotNull Long recipientId,
        @Size(max = 250) String subject,
        @Size(max = 120) String referenceNumber,
        @Size(max = 5000) String description) {

    public CreateDeliveryRequest {
        fullName = blankToNull(fullName);
        phone = blankToNull(phone);
        email = blankToNull(email);
        organizationName = blankToNull(organizationName);
        subject = blankToNull(subject);
        referenceNumber = blankToNull(referenceNumber);
        description = blankToNull(description);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
