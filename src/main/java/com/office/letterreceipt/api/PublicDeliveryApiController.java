package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.CreateDeliveryRequest;
import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.repository.IdempotencyKeyRepository;
import com.office.letterreceipt.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/public")
public class PublicDeliveryApiController {
    private static final Logger log = LoggerFactory.getLogger(PublicDeliveryApiController.class);
    private final DeliveryService service;
    private final IdempotencyKeyRepository idempotencyKeys;

    // Canonical recipient roles - matches mobile app constants
    private static final List<String> RECIPIENT_ROLES = List.of(
        "HR Officer",
        "IT Officer",
        "Finance Manager",
        "Human Resource Manager",
        "Chief Executive Officer",
        "Chief Technology Officer",
        "Managing Director",
        "Administrative Manager",
        "Accountant",
        "Procurement Officer",
        "Internal Auditor",
        "Risk Manager",
        "Security Manager",
        "Receptionist",
        "Driver"
    );

    public PublicDeliveryApiController(
            DeliveryService service,
            IdempotencyKeyRepository idempotencyKeys) {
        this.service = service;
        this.idempotencyKeys = idempotencyKeys;
    }

    @GetMapping("/recipient-roles")
    public List<String> recipientRoles() {
        return RECIPIENT_ROLES;
    }

    @PostMapping("/deliveries")
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryResponse create(
            @Valid @RequestBody CreateDeliveryRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest servletRequest) {
        log.info("CREATE DELIVERY DTO: fullName={}, phone={}, email={}, recipient={}, idempotencyKey={}",
                request.fullName(), request.phone(), request.email(), request.recipient(), idempotencyKey);
        return DeliveryResponse.full(service.create(request, idempotencyKey, servletRequest));
    }

    @GetMapping("/deliveries/{tracking}")
    public DeliveryResponse track(@PathVariable String tracking) {
        return DeliveryResponse.publicView(service.findByTracking(tracking));
    }
}