package com.office.letterreceipt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrganizationRequest(
        @NotBlank @Size(max = 180) String name,
        Boolean active) {}
