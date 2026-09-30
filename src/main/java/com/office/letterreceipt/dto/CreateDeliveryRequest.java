package com.office.letterreceipt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record CreateDeliveryRequest(
        @Size(max = 160) String fullName,
        @Size(max = 60) String phone,
        @Email @Size(max = 180) String email,
        @Size(max = 180) String organizationName,
        @Size(max = 160) String recipientPosition) {

    public CreateDeliveryRequest {
        fullName = blankToNull(fullName);
        phone = blankToNull(phone);
        email = blankToNull(email);
        organizationName = blankToNull(organizationName);
        recipientPosition = blankToNull(recipientPosition);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
