package com.office.letterreceipt.websocket;

import com.office.letterreceipt.model.LetterDelivery;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

@Component
public class WebSocketEventPublisher {
    private static final String DELIVERIES_TOPIC = "/topic/deliveries";

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyDeliveryCreated(LetterDelivery delivery) {
        Map<String, Object> deliveryData = new HashMap<>();
        deliveryData.put("id", delivery.getId());
        deliveryData.put("trackingNumber", delivery.getTrackingNumber());
        deliveryData.put("deliveryPersonName", delivery.getDeliveryPersonName());
        deliveryData.put("deliveryPersonPhone", delivery.getDeliveryPersonPhone());
        deliveryData.put("deliveryPersonEmail", delivery.getDeliveryPersonEmail());
        deliveryData.put("organizationName", delivery.getOrganizationName());
        deliveryData.put("organizationAddress", delivery.getOrganizationAddress());
        deliveryData.put("recipientName", delivery.getRecipientName());
        deliveryData.put("recipientTitle", delivery.getRecipientTitle());
        deliveryData.put("subject", delivery.getSubject());
        deliveryData.put("referenceNumber", delivery.getReferenceNumber());
        deliveryData.put("status", delivery.getStatus().name());
        deliveryData.put("deliveredAt", delivery.getDeliveredAt().toString());

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "DELIVERY_CREATED");
        payload.put("deliveryId", delivery.getId());
        payload.put("delivery", deliveryData);
        payload.put("message", "New delivery received");

        sendAfterCommit(payload);
    }

    public void notifyDeliveryReceived(LetterDelivery delivery) {
        Map<String, Object> deliveryData = new HashMap<>();
        deliveryData.put("id", delivery.getId());
        deliveryData.put("trackingNumber", delivery.getTrackingNumber());
        deliveryData.put("deliveryPersonName", delivery.getDeliveryPersonName());
        deliveryData.put("deliveryPersonPhone", delivery.getDeliveryPersonPhone());
        deliveryData.put("deliveryPersonEmail", delivery.getDeliveryPersonEmail());
        deliveryData.put("organizationName", delivery.getOrganizationName());
        deliveryData.put("organizationAddress", delivery.getOrganizationAddress());
        deliveryData.put("recipientName", delivery.getRecipientName());
        deliveryData.put("recipientTitle", delivery.getRecipientTitle());
        deliveryData.put("subject", delivery.getSubject());
        deliveryData.put("referenceNumber", delivery.getReferenceNumber());
        deliveryData.put("status", delivery.getStatus().name());
        deliveryData.put("deliveredAt", delivery.getDeliveredAt().toString());
        deliveryData.put("receivedAt", delivery.getReceivedAt() != null ? delivery.getReceivedAt().toString() : null);

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "DELIVERY_STATUS_CHANGED");
        payload.put("deliveryId", delivery.getId());
        payload.put("status", delivery.getStatus().name());
        payload.put("delivery", deliveryData);

        sendAfterCommit(payload);
    }

    // Clients reload from the API when notified, so only announce changes once they are committed.
    private void sendAfterCommit(Object payload) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    messagingTemplate.convertAndSend(DELIVERIES_TOPIC, payload);
                }
            });
        } else {
            messagingTemplate.convertAndSend(DELIVERIES_TOPIC, payload);
        }
    }
}
