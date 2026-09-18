package com.office.letterreceipt.service;

import com.office.letterreceipt.dto.CreateDeliveryRequest;
import com.office.letterreceipt.model.DeliveryEvent;
import com.office.letterreceipt.model.DeliveryEventType;
import com.office.letterreceipt.model.DeliveryPerson;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.model.Organization;
import com.office.letterreceipt.model.Recipient;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.DeliveryEventRepository;
import com.office.letterreceipt.repository.DeliveryPersonRepository;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.repository.UserAccountRepository;
import com.office.letterreceipt.websocket.WebSocketEventPublisher;
import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class DeliveryService {
    private static final char[] TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final LetterDeliveryRepository deliveries;
    private final DeliveryPersonRepository people;
    private final OrganizationRepository organizations;
    private final RecipientRepository recipients;
    private final DeliveryEventRepository events;
    private final UserAccountRepository users;
    private final Clock clock;
    private final WebSocketEventPublisher wsPublisher;

    public DeliveryService(
            LetterDeliveryRepository deliveries,
            DeliveryPersonRepository people,
            OrganizationRepository organizations,
            RecipientRepository recipients,
            DeliveryEventRepository events,
            UserAccountRepository users,
            Clock clock,
            WebSocketEventPublisher wsPublisher) {
        this.deliveries = deliveries;
        this.people = people;
        this.organizations = organizations;
        this.recipients = recipients;
        this.events = events;
        this.users = users;
        this.clock = clock;
        this.wsPublisher = wsPublisher;
    }

    @Transactional
    public LetterDelivery create(CreateDeliveryRequest request, HttpServletRequest servletRequest) {
        Recipient recipient = recipients.findById(request.recipientId())
            .filter(Recipient::isActive)
            .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Select a valid active recipient."));
        Organization organization = resolveOrganization(request);
        DeliveryPerson person = resolvePerson(request, organization);

        String subject = clean(request.subject(), 250);
        if (!StringUtils.hasText(subject)) {
            throw new ResponseStatusException(BAD_REQUEST, "Letter subject is required.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LetterDelivery delivery = new LetterDelivery();
        delivery.setDeliveryPerson(person);
        delivery.setOrganization(organization);
        delivery.setRecipient(recipient);
        delivery.setDeliveryPersonName(person.getFullName());
        delivery.setDeliveryPersonPhone(person.getPhone());
        delivery.setDeliveryPersonEmail(person.getEmail());
        delivery.setOrganizationName(organization.getName());
        delivery.setRecipientName(recipient.getFullName());
        delivery.setRecipientTitle(clean(recipient.getJobTitle(), 160));
        delivery.setSubject(subject);
        delivery.setReferenceNumber(clean(request.referenceNumber(), 120));
        delivery.setDescription(clean(request.description(), 5000));
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(now);
        delivery.setTrackingNumber(newTrackingNumber());
        delivery = deliveries.save(delivery);
        addEvent(delivery, DeliveryEventType.DELIVERED, person.getFullName(),
            "Letter submitted for receipt confirmation", servletRequest, now);
        wsPublisher.notifyDeliveryCreated(delivery);
        return delivery;
    }

    @Transactional
    public LetterDelivery receive(Long id, String username, String remarks, HttpServletRequest servletRequest) {
        LetterDelivery delivery = deliveries.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Delivery not found."));
        if (delivery.getStatus() == DeliveryStatus.RECEIVED) {
            return delivery;
        }
        UserAccount receiver = users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Authenticated user not found."));
        LocalDateTime now = LocalDateTime.now(clock);
        delivery.setStatus(DeliveryStatus.RECEIVED);
        delivery.setReceivedAt(now);
        delivery.setReceivedBy(receiver);
        try {
            deliveries.save(delivery);
        } catch (OptimisticLockingFailureException ex) {
            throw new ResponseStatusException(CONFLICT, "This letter was updated by another user. Refresh and try again.");
        }
        addEvent(delivery, DeliveryEventType.RECEIVED, receiver.getDisplayName(),
            StringUtils.hasText(remarks) ? clean(remarks, 500) : "Physical letter verified and received",
            servletRequest, now);
        wsPublisher.notifyDeliveryReceived(delivery);
        return delivery;
    }

    public LetterDelivery findByTracking(String tracking) {
        return deliveries.findByTrackingNumberIgnoreCase(tracking.trim())
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Tracking number not found."));
    }

    private Organization resolveOrganization(CreateDeliveryRequest request) {
        if (request.organizationId() != null) {
            return organizations.findById(request.organizationId())
                .filter(Organization::isActive)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Select a valid organization."));
        }
        String name = clean(request.organizationName(), 180);
        if (!StringUtils.hasText(name)) {
            throw new ResponseStatusException(BAD_REQUEST, "Organization is required.");
        }
        return organizations.findByNameIgnoreCase(name).orElseGet(() -> {
            Organization organization = new Organization();
            organization.setName(name);
            organization.setActive(true);
            return organizations.save(organization);
        });
    }

    private DeliveryPerson resolvePerson(CreateDeliveryRequest request, Organization organization) {
        if (request.deliveryPersonId() != null) {
            DeliveryPerson person = people.findById(request.deliveryPersonId())
                .filter(DeliveryPerson::isActive)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Select a valid delivery person."));
            if (StringUtils.hasText(request.phone())) {
                person.setPhone(clean(request.phone(), 60));
            }
            if (StringUtils.hasText(request.email())) {
                person.setEmail(clean(request.email(), 180));
            }
            person.setOrganization(organization);
            return people.save(person);
        }
        String name = clean(request.fullName(), 160);
        if (!StringUtils.hasText(name)) {
            throw new ResponseStatusException(BAD_REQUEST, "Delivery person's name is required.");
        }
        DeliveryPerson person = new DeliveryPerson();
        person.setFullName(name);
        person.setPhone(clean(request.phone(), 60));
        person.setEmail(clean(request.email(), 180));
        person.setOrganization(organization);
        person.setActive(true);
        return people.save(person);
    }

    private void addEvent(
            LetterDelivery delivery,
            DeliveryEventType type,
            String actor,
            String remarks,
            HttpServletRequest request,
            LocalDateTime at) {
        DeliveryEvent event = new DeliveryEvent();
        event.setDelivery(delivery);
        event.setEventType(type);
        event.setActorName(actor);
        event.setRemarks(remarks);
        event.setEventAt(at);
        if (request != null) {
            event.setIpAddress(clientIp(request));
            event.setUserAgent(clean(request.getHeader("User-Agent"), 500));
        }
        events.save(event);
    }

    private String newTrackingNumber() {
        for (int attempt = 0; attempt < 8; attempt++) {
            String token = randomTrackingToken();
            if (!deliveries.existsByTrackingNumberIgnoreCase(token)) {
                return token;
            }
        }
        throw new IllegalStateException("Could not allocate a unique tracking number.");
    }

    static String randomTrackingToken() {
        char[] chars = new char[14];
        for (int i = 0; i < chars.length; i++) {
            if (i == 4 || i == 9) {
                chars[i] = '-';
            } else {
                chars[i] = TRACKING_ALPHABET[RANDOM.nextInt(TRACKING_ALPHABET.length)];
            }
        }
        return new String(chars);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return clean(forwarded.split(",")[0].trim(), 64);
        }
        return clean(request.getRemoteAddr(), 64);
    }

    private String clean(String value, int max) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.substring(0, Math.min(max, trimmed.length()));
    }
}
