package com.office.letterreceipt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDeliveryRequest(
        @NotBlank @Size(max = 160) String fullName,
        @Size(max = 60) String phone,
        @Email @Size(max = 180) String email,
        @Size(max = 160) String recipientPosition) {

    public CreateDeliveryRequest {
        fullName = blankToNull(fullName);
        phone = blankToNull(phone);
        email = blankToNull(email);
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
