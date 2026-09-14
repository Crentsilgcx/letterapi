package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.CreateDeliveryRequest;
import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.model.DeliveryPerson;
import com.office.letterreceipt.repository.DeliveryPersonRepository;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicDeliveryApiController {
    private final DeliveryService service;
    private final RecipientRepository recipients;
    private final OrganizationRepository organizations;
    private final DeliveryPersonRepository people;

    public PublicDeliveryApiController(
            DeliveryService service,
            RecipientRepository recipients,
            OrganizationRepository organizations,
            DeliveryPersonRepository people) {
        this.service = service;
        this.recipients = recipients;
        this.organizations = organizations;
        this.people = people;
    }

    @GetMapping("/recipients")
    public List<Map<String, Object>> recipients() {
        return recipients.findByActiveTrueOrderBySortOrderAscFullNameAsc().stream()
            .map(recipient -> Map.<String, Object>of(
                "id", recipient.getId(),
                "name", recipient.getFullName(),
                "title", Objects.toString(recipient.getJobTitle(), ""),
                "department", Objects.toString(recipient.getDepartment(), "")))
            .toList();
    }

    @GetMapping("/organizations")
    public List<Map<String, Object>> organizations() {
        return organizations.findByActiveTrueOrderByNameAsc().stream()
            .map(organization -> Map.<String, Object>of("id", organization.getId(), "name", organization.getName()))
            .toList();
    }

    @GetMapping("/delivery-persons")
    public List<Map<String, Object>> people(@RequestParam(defaultValue = "") String q) {
        List<DeliveryPerson> result = q.isBlank()
            ? people.findTop100ByActiveTrueOrderByFullNameAsc()
            : people.findTop20ByActiveTrueAndFullNameContainingIgnoreCaseOrderByFullNameAsc(q.trim());
        return result.stream().map(person -> {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("id", person.getId());
            body.put("name", person.getFullName());
            body.put("organizationId", person.getOrganization() == null ? null : person.getOrganization().getId());
            body.put("organizationName", person.getOrganization() == null ? "" : person.getOrganization().getName());
            return body;
        }).toList();
    }

    @PostMapping("/deliveries")
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryResponse create(
            @Valid @RequestBody CreateDeliveryRequest request,
            HttpServletRequest servletRequest) {
        return DeliveryResponse.full(service.create(request, servletRequest));
    }

    @GetMapping("/deliveries/{tracking}")
    public DeliveryResponse track(@PathVariable String tracking) {
        return DeliveryResponse.publicView(service.findByTracking(tracking));
    }
}
