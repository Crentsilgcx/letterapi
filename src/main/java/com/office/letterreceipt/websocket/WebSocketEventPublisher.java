package com.office.letterreceipt.websocket;

import com.office.letterreceipt.model.LetterDelivery;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;

@Component
public class WebSocketEventPublisher {
    private static final String DELIVERIES_TOPIC = "/topic/deliveries";

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyDeliveryCreated(LetterDelivery delivery) {
        sendAfterCommit(Map.of(
            "type", "DELIVERY_CREATED",
            "deliveryId", delivery.getId(),
            "recipient", delivery.getRecipientName(),
            "status", delivery.getStatus().name(),
            "message", "New delivery received"
        ));
    }

    public void notifyDeliveryReceived(LetterDelivery delivery) {
        sendAfterCommit(Map.of(
            "type", "DELIVERY_STATUS_CHANGED",
            "deliveryId", delivery.getId(),
            "status", delivery.getStatus().name()
        ));
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
