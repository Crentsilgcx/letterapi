package com.office.letterreceipt.web;

import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.repository.DeliveryEventRepository;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/reception")
public class ReceptionWebController {
    private final LetterDeliveryRepository deliveries;
    private final DeliveryEventRepository events;
    private final DeliveryService service;
    private final Clock clock;
    private final String organizationName;

    public ReceptionWebController(
            LetterDeliveryRepository deliveries,
            DeliveryEventRepository events,
            DeliveryService service,
            Clock clock,
            @Value("${app.organization-name:Our Office}") String organizationName) {
        this.deliveries = deliveries;
        this.events = events;
        this.service = service;
        this.clock = clock;
        this.organizationName = organizationName;
    }

    @GetMapping
    public String dashboard(Model model) {
        LocalDate today = LocalDate.now(clock);
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        model.addAttribute("organizationName", organizationName);
        model.addAttribute("pending", deliveries.findTop100ByStatusOrderByDeliveredAtAsc(DeliveryStatus.DELIVERED));
        model.addAttribute("recent", deliveries.findTop20ByOrderByDeliveredAtDesc());
        model.addAttribute("pendingCount", deliveries.countByStatus(DeliveryStatus.DELIVERED));
        model.addAttribute("todayCount", deliveries.countByDeliveredAtBetween(start, end));
        model.addAttribute("todayReceived", deliveries.countByStatusAndReceivedAtBetween(DeliveryStatus.RECEIVED, start, end));
        return "reception/dashboard";
    }

    @PostMapping("/deliveries/{id}/receive")
    public String receive(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks,
            Principal principal,
            HttpServletRequest request,
            RedirectAttributes redirect) {
        service.receive(id, principal.getName(), remarks, request);
        redirect.addFlashAttribute("success", "Receipt confirmed successfully.");
        return "redirect:/reception";
    }

    @GetMapping("/deliveries/{id}")
    public String detail(@PathVariable Long id, Model model) {
        var delivery = deliveries.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found."));
        model.addAttribute("organizationName", organizationName);
        model.addAttribute("delivery", delivery);
        model.addAttribute("events", events.findByDeliveryIdOrderByEventAtAsc(id));
        return "reception/detail";
    }

    @GetMapping("/deliveries")
    public String register(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            Model model) {
        DeliveryStatus parsed = null;
        if (status != null && !status.isBlank()) {
            try {
                parsed = DeliveryStatus.valueOf(status);
            } catch (IllegalArgumentException ignored) {
                parsed = null;
            }
        }
        var result = deliveries.search(
            parsed,
            q == null ? "" : q.trim(),
            PageRequest.of(Math.max(page, 0), 25, Sort.by("deliveredAt").descending()));
        model.addAttribute("organizationName", organizationName);
        model.addAttribute("deliveries", result);
        model.addAttribute("q", q);
        model.addAttribute("status", status);
        return "reception/register";
    }
}
