package com.office.letterreceipt.web;

import com.office.letterreceipt.dto.OrganizationRequest;
import com.office.letterreceipt.dto.PasswordResetRequest;
import com.office.letterreceipt.dto.RecipientRequest;
import com.office.letterreceipt.dto.StaffUserRequest;
import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.repository.UserAccountRepository;
import com.office.letterreceipt.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin")
public class AdminWebController {
    private final RecipientRepository recipients;
    private final OrganizationRepository organizations;
    private final UserAccountRepository users;
    private final AdminService service;
    private final String organizationName;

    public AdminWebController(
            RecipientRepository recipients,
            OrganizationRepository organizations,
            UserAccountRepository users,
            AdminService service,
            @Value("${app.organization-name:Our Office}") String organizationName) {
        this.recipients = recipients;
        this.organizations = organizations;
        this.users = users;
        this.service = service;
        this.organizationName = organizationName;
    }

    @GetMapping
    public String admin(Model model) {
        model.addAttribute("organizationName", organizationName);
        model.addAttribute("recipients", recipients.findAllByOrderBySortOrderAscFullNameAsc());
        model.addAttribute("organizations", organizations.findAllByOrderByNameAsc());
        model.addAttribute("users", users.findAllByOrderByDisplayNameAsc());
        model.addAttribute("roles", Role.values());
        return "admin/index";
    }

    @PostMapping("/recipients")
    public String addRecipient(
            @Valid @ModelAttribute RecipientRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "recipients")) {
            return "redirect:/admin#recipients";
        }
        service.saveRecipient(null, request);
        redirect.addFlashAttribute("success", "Recipient added.");
        return "redirect:/admin#recipients";
    }

    @PostMapping("/recipients/{id}/edit")
    public String editRecipient(
            @PathVariable Long id,
            @Valid @ModelAttribute RecipientRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "recipients")) {
            return "redirect:/admin#recipients";
        }
        service.saveRecipient(id, request);
        redirect.addFlashAttribute("success", "Recipient updated.");
        return "redirect:/admin#recipients";
    }

    @PostMapping("/recipients/{id}/toggle")
    public String toggleRecipient(@PathVariable Long id, RedirectAttributes redirect) {
        service.toggleRecipient(id);
        redirect.addFlashAttribute("success", "Recipient status updated.");
        return "redirect:/admin#recipients";
    }

    @PostMapping("/organizations")
    public String addOrg(
            @Valid @ModelAttribute OrganizationRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "organizations")) {
            return "redirect:/admin#organizations";
        }
        service.saveOrganization(null, request);
        redirect.addFlashAttribute("success", "Organization added.");
        return "redirect:/admin#organizations";
    }

    @PostMapping("/organizations/{id}/edit")
    public String editOrg(
            @PathVariable Long id,
            @Valid @ModelAttribute OrganizationRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "organizations")) {
            return "redirect:/admin#organizations";
        }
        service.saveOrganization(id, request);
        redirect.addFlashAttribute("success", "Organization updated.");
        return "redirect:/admin#organizations";
    }

    @PostMapping("/organizations/{id}/toggle")
    public String toggleOrg(@PathVariable Long id, RedirectAttributes redirect) {
        service.toggleOrganization(id);
        redirect.addFlashAttribute("success", "Organization status updated.");
        return "redirect:/admin#organizations";
    }

    @PostMapping("/users")
    public String addUser(
            @Valid @ModelAttribute StaffUserRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "users")) {
            return "redirect:/admin#users";
        }
        service.createUser(request.username(), request.displayName(), request.password(), request.role());
        redirect.addFlashAttribute("success", "User created.");
        return "redirect:/admin#users";
    }

    @PostMapping("/users/{id}/toggle")
    public String toggleUser(@PathVariable Long id, RedirectAttributes redirect) {
        service.toggleUser(id);
        redirect.addFlashAttribute("success", "User status updated.");
        return "redirect:/admin#users";
    }

    @PostMapping("/users/{id}/password")
    public String password(
            @PathVariable Long id,
            @Valid @ModelAttribute PasswordResetRequest request,
            BindingResult binding,
            RedirectAttributes redirect) {
        if (reject(binding, redirect, "users")) {
            return "redirect:/admin#users";
        }
        service.resetPassword(id, request.password());
        redirect.addFlashAttribute("success", "Password reset.");
        return "redirect:/admin#users";
    }

    private boolean reject(BindingResult binding, RedirectAttributes redirect, String section) {
        if (!binding.hasErrors()) {
            return false;
        }
        FieldError fieldError = binding.getFieldError();
        String message = fieldError == null
            ? "Please check the form."
            : fieldError.getField() + ": " + fieldError.getDefaultMessage();
        redirect.addFlashAttribute("error", message);
        redirect.addFlashAttribute("errorSection", section);
        return true;
    }
}
