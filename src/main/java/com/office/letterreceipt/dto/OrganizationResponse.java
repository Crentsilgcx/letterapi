package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.Organization;

public record OrganizationResponse(Long id, String name, boolean active) {
    public static OrganizationResponse from(Organization organization) {
        return new OrganizationResponse(organization.getId(), organization.getName(), organization.isActive());
    }
}
