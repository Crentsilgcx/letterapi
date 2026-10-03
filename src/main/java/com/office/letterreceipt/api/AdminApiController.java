package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.OrganizationRequest;
import com.office.letterreceipt.dto.OrganizationResponse;
import com.office.letterreceipt.dto.RecipientRequest;
import com.office.letterreceipt.dto.RecipientResponse;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.repository.UserAccountRepository;
import com.office.letterreceipt.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {
    private final RecipientRepository recipients;
    private final OrganizationRepository organizations;
    private final UserAccountRepository users;
    private final AdminService service;
    private final AuthenticationManager authenticationManager;

    public AdminApiController(
            RecipientRepository recipients,
            OrganizationRepository organizations,
            UserAccountRepository users,
            AdminService service,
            AuthenticationManager authenticationManager) {
        this.recipients = recipients;
        this.organizations = organizations;
        this.users = users;
        this.service = service;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public Map<String, Object> login(HttpServletRequest request, @RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        if (username == null || password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
        UserAccount user = users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return Map.of(
                "username", user.getUsername(),
                "displayName", user.getDisplayName(),
                "role", user.getRole().name());
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        long start = System.currentTimeMillis();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        UserAccount user = users.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Map<String, Object> result = Map.of(
                "username", user.getUsername(),
                "displayName", user.getDisplayName(),
                "role", user.getRole().name());
        System.out.println("[PERF] /me: " + (System.currentTimeMillis() - start) + " ms");
        return result;
    }

    @GetMapping("/recipients")
    public List<RecipientResponse> recipients() {
        return recipients.findAllByOrderByFullNameAsc().stream()
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

    @PutMapping("/organizations/{id}/toggle")
    public OrganizationResponse toggleOrganization(@PathVariable Long id) {
        service.toggleOrganization(id);
        return OrganizationResponse.from(organizations.findById(id).orElseThrow());
    }
}
