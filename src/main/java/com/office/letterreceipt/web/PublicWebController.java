package com.office.letterreceipt.web;

import com.office.letterreceipt.service.DeliveryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class PublicWebController {
    private final DeliveryService deliveryService;
    private final String organizationName;

    public PublicWebController(
            DeliveryService deliveryService,
            @Value("${app.organization-name:Our Office}") String organizationName) {
        this.deliveryService = deliveryService;
        this.organizationName = organizationName;
    }

    @GetMapping("/track")
    public String trackForm(Model model) {
        model.addAttribute("organizationName", organizationName);
        return "public/track";
    }

    @GetMapping("/track/{tracking}")
    public String track(@PathVariable String tracking, Model model) {
        model.addAttribute("organizationName", organizationName);
        try {
            model.addAttribute("delivery", deliveryService.findByTracking(tracking));
        } catch (ResponseStatusException exception) {
            model.addAttribute("notFound", true);
            model.addAttribute("tracking", tracking);
        }
        return "public/track";
    }

    @GetMapping("/login")
    public String login(Model model) {
        model.addAttribute("organizationName", organizationName);
        return "auth/login";
    }
}