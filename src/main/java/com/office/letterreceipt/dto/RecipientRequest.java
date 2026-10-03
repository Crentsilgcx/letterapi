package com.office.letterreceipt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecipientRequest(
        @NotBlank @Size(max = 160) String fullName,
        @Size(max = 160) String jobTitle,
        @Size(max = 160) String department,
        Boolean active) {}
