package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.OrganizationRequest;
import com.office.letterreceipt.dto.OrganizationResponse;
import com.office.letterreceipt.dto.RecipientRequest;
import com.office.letterreceipt.dto.RecipientResponse;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {
    private final RecipientRepository recipients;
    private final OrganizationRepository organizations;
    private final AdminService service;

    public AdminApiController(
            RecipientRepository recipients,
            OrganizationRepository organizations,
            AdminService service) {
        this.recipients = recipients;
        this.organizations = organizations;
        this.service = service;
    }

    @GetMapping("/recipients")
    public List<RecipientResponse> recipients() {
        return recipients.findAllByOrderBySortOrderAscFullNameAsc().stream()
            .map(RecipientResponse::from)
            .toList();
    }

    @PostMapping("/recipients")
    public RecipientResponse createRecipient(@Valid @RequestBody RecipientRequest request) {
        return RecipientResponse.from(service.saveRecipient(null, request));
    }

    @PutMapping("/recipients/{id}")
    public RecipientResponse updateRecipient(@PathVariable Long id, @Valid @RequestBody RecipientRequest request) {
        return RecipientResponse.from(service.saveRecipient(id, request));
    }

    @GetMapping("/organizations")
    public List<OrganizationResponse> organizations() {
        return organizations.findAllByOrderByNameAsc().stream()
            .map(OrganizationResponse::from)
            .toList();
    }

    @PostMapping("/organizations")
    public OrganizationResponse createOrganization(@Valid @RequestBody OrganizationRequest request) {
        return OrganizationResponse.from(service.saveOrganization(null, request));
    }

    @PutMapping("/organizations/{id}")
    public OrganizationResponse updateOrganization(
            @PathVariable Long id,
            @Valid @RequestBody OrganizationRequest request) {
        return OrganizationResponse.from(service.saveOrganization(id, request));
    }
}
