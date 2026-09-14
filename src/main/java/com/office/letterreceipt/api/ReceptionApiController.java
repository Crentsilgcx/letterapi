package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.dto.ReceiveDeliveryRequest;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reception")
public class ReceptionApiController {
    private final LetterDeliveryRepository deliveries;
    private final DeliveryService service;

    public ReceptionApiController(LetterDeliveryRepository deliveries, DeliveryService service) {
        this.deliveries = deliveries;
        this.service = service;
    }

    @GetMapping("/deliveries/pending")
    public List<DeliveryResponse> pending() {
        return deliveries.findTop100ByStatusOrderByDeliveredAtAsc(DeliveryStatus.DELIVERED).stream()
            .map(DeliveryResponse::full)
            .toList();
    }

    @PostMapping("/deliveries/{id}/receive")
    public DeliveryResponse receive(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ReceiveDeliveryRequest request,
            Principal principal,
            HttpServletRequest servletRequest) {
        String remarks = request == null ? null : request.remarks();
        return DeliveryResponse.full(service.receive(id, principal.getName(), remarks, servletRequest));
    }
}
