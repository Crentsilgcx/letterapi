package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StaffUserRequest(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Size(max = 160) String displayName,
        @NotBlank @Size(min = 12, max = 72) String password,
        @NotNull Role role) {}
