package com.office.letterreceipt.web;

import com.office.letterreceipt.repository.DeliveryPersonRepository;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.service.DeliveryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class PublicWebController {
    private final RecipientRepository recipients;
    private final OrganizationRepository organizations;
    private final DeliveryPersonRepository people;
    private final DeliveryService deliveryService;
    private final String organizationName;

    public PublicWebController(
            RecipientRepository recipients,
            OrganizationRepository organizations,
            DeliveryPersonRepository people,
            DeliveryService deliveryService,
            @Value("${app.organization-name:Our Office}") String organizationName) {
        this.recipients = recipients;
        this.organizations = organizations;
        this.people = people;
        this.deliveryService = deliveryService;
        this.organizationName = organizationName;
    }

    @GetMapping({"/", "/deliver"})
    public String home(Model model) {
        base(model);
        model.addAttribute("recipients", recipients.findByActiveTrueOrderBySortOrderAscFullNameAsc());
        model.addAttribute("organizations", organizations.findByActiveTrueOrderByNameAsc());
        model.addAttribute("people", people.findTop100ByActiveTrueOrderByFullNameAsc());
        return "public/deliver";
    }

    @GetMapping("/track")
    public String trackForm(Model model) {
        base(model);
        return "public/track";
    }

    @GetMapping("/track/{tracking}")
    public String track(@PathVariable String tracking, Model model) {
        base(model);
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
        base(model);
        return "auth/login";
    }

    private void base(Model model) {
        model.addAttribute("organizationName", organizationName);
    }
}
