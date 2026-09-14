package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.Recipient;

public record RecipientResponse(
        Long id,
        String fullName,
        String jobTitle,
        String department,
        boolean active,
        int sortOrder) {

    public static RecipientResponse from(Recipient recipient) {
        return new RecipientResponse(
            recipient.getId(),
            recipient.getFullName(),
            recipient.getJobTitle(),
            recipient.getDepartment(),
            recipient.isActive(),
            recipient.getSortOrder());
    }
}
