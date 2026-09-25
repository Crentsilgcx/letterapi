package com.office.letterreceipt.service;

import com.office.letterreceipt.dto.CreateDeliveryRequest;
import com.office.letterreceipt.model.DeliveryEvent;
import com.office.letterreceipt.model.DeliveryEventType;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.repository.DeliveryEventRepository;
import com.office.letterreceipt.repository.UserAccountRepository;
import com.office.letterreceipt.websocket.WebSocketEventPublisher;
import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
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
    private final DeliveryEventRepository events;
    private final UserAccountRepository users;
    private final Clock clock;
    private final WebSocketEventPublisher wsPublisher;

    public DeliveryService(
            LetterDeliveryRepository deliveries,
            DeliveryEventRepository events,
            UserAccountRepository users,
            Clock clock,
            WebSocketEventPublisher wsPublisher) {
        this.deliveries = deliveries;
        this.events = events;
        this.users = users;
        this.clock = clock;
        this.wsPublisher = wsPublisher;
    }

    @Transactional
    public LetterDelivery create(CreateDeliveryRequest request, HttpServletRequest servletRequest) {
        String subject = clean(request.subject(), 250);
        if (!StringUtils.hasText(subject)) {
            subject = "Delivery to " + request.recipientPosition();
        }

        // Prevent duplicate delivery submissions (same person, org, recipient, subject within 30 seconds)
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime threshold = now.minusSeconds(30);
        Optional<LetterDelivery> recentDuplicate = deliveries.findFirstByDeliveryPersonNameAndOrganizationNameAndRecipientNameAndSubjectAndDeliveredAtAfter(
            request.fullName(), request.organizationName(), request.recipientPosition(), subject, threshold);
        if (recentDuplicate.isPresent()) {
            throw new ResponseStatusException(CONFLICT, "A similar delivery was just submitted. Please wait before submitting again.");
        }

        LetterDelivery delivery = new LetterDelivery();
        // Store denormalized data directly - no entity creation
        delivery.setDeliveryPerson(null);
        delivery.setOrganization(null);
        delivery.setRecipient(null);
        delivery.setDeliveryPersonName(request.fullName());
        delivery.setDeliveryPersonPhone(request.phone());
        delivery.setDeliveryPersonEmail(request.email());
        delivery.setOrganizationName(request.organizationName());
        delivery.setOrganizationAddress(request.organizationAddress());
        delivery.setRecipientName(request.recipientPosition());
        delivery.setRecipientTitle(request.recipientPosition());
        delivery.setSubject(subject);
        delivery.setReferenceNumber(clean(request.referenceNumber(), 120));
        delivery.setDescription(clean(request.description(), 5000));
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(now);
        delivery.setTrackingNumber(newTrackingNumber());
        delivery = deliveries.save(delivery);
        addEvent(delivery, DeliveryEventType.DELIVERED, request.fullName(),
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