package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.dto.PageResponse;
import com.office.letterreceipt.dto.ReceiveDeliveryRequest;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/deliveries/pending/page")
    public PageResponse<DeliveryResponse> pendingPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String organization) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "deliveredAt"));
        LocalDateTime from = parseDate(dateFrom);
        LocalDateTime to = parseDateToEndOfDay(dateTo);
        Page<LetterDelivery> result = deliveries.searchWithFilters(
                DeliveryStatus.DELIVERED, q, recipientPosition, organization, from, to, pageable);
        return PageResponse.from(result.map(DeliveryResponse::full));
    }

    @GetMapping("/deliveries/received")
    public List<DeliveryResponse> received() {
        return deliveries.findTop100ByStatusOrderByReceivedAtDesc(DeliveryStatus.RECEIVED).stream()
            .map(DeliveryResponse::full)
            .toList();
    }

    @GetMapping("/deliveries/received/page")
    public PageResponse<DeliveryResponse> receivedPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String organization) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedAt"));
        LocalDateTime from = parseDate(dateFrom);
        LocalDateTime to = parseDateToEndOfDay(dateTo);
        Page<LetterDelivery> result = deliveries.searchWithFilters(
                DeliveryStatus.RECEIVED, q, recipientPosition, organization, from, to, pageable);
        return PageResponse.from(result.map(DeliveryResponse::full));
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDateTime.parse(dateStr + "T00:00:00");
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateToEndOfDay(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDateTime.parse(dateStr + "T23:59:59");
        } catch (Exception e) {
            return null;
        }
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

    @GetMapping("/statistics")
    public Map<String, Object> statistics() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long receivedToday = deliveries.countByStatusAndReceivedAtBetween(DeliveryStatus.RECEIVED, todayStart, todayEnd);
        long pending = deliveries.countByStatus(DeliveryStatus.DELIVERED);
        return Map.of(
            "pendingCount", pending,
            "receivedTodayCount", receivedToday
        );
    }
}
