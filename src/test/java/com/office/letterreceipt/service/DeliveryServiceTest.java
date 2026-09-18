package com.office.letterreceipt.service;

import com.office.letterreceipt.websocket.WebSocketEventPublisher;
import com.office.letterreceipt.dto.CreateDeliveryRequest;
import com.office.letterreceipt.model.DeliveryEventType;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.model.Organization;
import com.office.letterreceipt.model.Recipient;
import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.DeliveryEventRepository;
import com.office.letterreceipt.repository.DeliveryPersonRepository;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import com.office.letterreceipt.repository.OrganizationRepository;
import com.office.letterreceipt.repository.RecipientRepository;
import com.office.letterreceipt.repository.UserAccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DeliveryServiceTest {
    @Test
    void createUsesServerTimeAndRandomTrackingToken() {
        LetterDeliveryRepository deliveries = mock(LetterDeliveryRepository.class);
        DeliveryPersonRepository people = mock(DeliveryPersonRepository.class);
        OrganizationRepository organizations = mock(OrganizationRepository.class);
        RecipientRepository recipients = mock(RecipientRepository.class);
        DeliveryEventRepository events = mock(DeliveryEventRepository.class);
        UserAccountRepository users = mock(UserAccountRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        Clock clock = Clock.fixed(Instant.parse("2026-09-14T10:47:21Z"), ZoneId.of("Africa/Accra"));

        Recipient recipient = new Recipient();
        recipient.setId(7L);
        recipient.setFullName("Chief Executive Officer");
        recipient.setJobTitle("CEO");
        recipient.setActive(true);
        Organization organization = new Organization();
        organization.setId(3L);
        organization.setName("Example Ministry");
        organization.setActive(true);
        when(recipients.findById(7L)).thenReturn(Optional.of(recipient));
        when(organizations.findById(3L)).thenReturn(Optional.of(organization));
        when(people.save(any())).thenAnswer(invocation -> {
            var person = invocation.getArgument(0, com.office.letterreceipt.model.DeliveryPerson.class);
            person.setId(9L);
            return person;
        });
        when(deliveries.existsByTrackingNumberIgnoreCase(anyString())).thenReturn(false);
        when(deliveries.save(any(LetterDelivery.class))).thenAnswer(invocation -> {
            LetterDelivery delivery = invocation.getArgument(0);
            delivery.setId(42L);
            return delivery;
        });

        DeliveryService service = new DeliveryService(
            deliveries, people, organizations, recipients, events, users, clock, mock(WebSocketEventPublisher.class));
        LetterDelivery delivery = service.create(
            new CreateDeliveryRequest(
                null, "Kwame Mensah", "0200000000", null, 3L, null, 7L,
                "Request for Information", "REF-100", null),
            request);

        assertTrue(delivery.getTrackingNumber().matches("[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}"));
        assertFalse(delivery.getTrackingNumber().matches("LTR-\\d{4}-\\d+"));
        assertFalse(delivery.getTrackingNumber().contains("000042"));
        assertEquals(LocalDateTime.of(2026, 9, 14, 10, 47, 21), delivery.getDeliveredAt());
        assertEquals(DeliveryStatus.DELIVERED, delivery.getStatus());
        verify(events).save(argThat(event ->
            event.getEventType() == DeliveryEventType.DELIVERED && event.getActorName().equals("Kwame Mensah")));
    }

    @Test
    void receiveRecordsAuthenticatedStaffAndServerTime() {
        LetterDeliveryRepository deliveries = mock(LetterDeliveryRepository.class);
        DeliveryPersonRepository people = mock(DeliveryPersonRepository.class);
        OrganizationRepository organizations = mock(OrganizationRepository.class);
        RecipientRepository recipients = mock(RecipientRepository.class);
        DeliveryEventRepository events = mock(DeliveryEventRepository.class);
        UserAccountRepository users = mock(UserAccountRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        Clock clock = Clock.fixed(Instant.parse("2026-09-14T10:49:00Z"), ZoneId.of("Africa/Accra"));
        LetterDelivery delivery = new LetterDelivery();
        delivery.setId(42L);
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setTrackingNumber("K7M2-9QWX-4NPH");
        UserAccount receiver = new UserAccount();
        receiver.setId(2L);
        receiver.setUsername("reception");
        receiver.setDisplayName("Front Desk");
        receiver.setRole(Role.RECEPTIONIST);
        receiver.setActive(true);
        when(deliveries.findById(42L)).thenReturn(Optional.of(delivery));
        when(users.findByUsernameIgnoreCase("reception")).thenReturn(Optional.of(receiver));
        when(deliveries.save(any(LetterDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DeliveryService service = new DeliveryService(
            deliveries, people, organizations, recipients, events, users, clock, mock(WebSocketEventPublisher.class));
        LetterDelivery received = service.receive(42L, "reception", null, request);
        assertEquals(DeliveryStatus.RECEIVED, received.getStatus());
        assertSame(receiver, received.getReceivedBy());
        assertEquals(LocalDateTime.of(2026, 9, 14, 10, 49), received.getReceivedAt());
    }
}
