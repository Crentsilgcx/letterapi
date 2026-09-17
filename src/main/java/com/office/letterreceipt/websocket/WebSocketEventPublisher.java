package com.office.letterreceipt.websocket;

import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyDeliveryCreated(LetterDelivery delivery) {
        var response = DeliveryResponse.full(delivery);
        messagingTemplate.convertAndSend("/topic/deliveries", Map.of(
            "type", "DELIVERY_CREATED",
            "deliveryId", delivery.getId(),
            "recipient", delivery.getRecipientName(),
            "status", delivery.getStatus().name(),
            "message", "New delivery received"
        ));
    }

    public void notifyDeliveryReceived(LetterDelivery delivery) {
        var response = DeliveryResponse.full(delivery);
        messagingTemplate.convertAndSend("/topic/deliveries", Map.of(
            "type", "DELIVERY_STATUS_CHANGED",
            "deliveryId", delivery.getId(),
            "status", delivery.getStatus().name()
        ));
    }

    public void notifyStatusChanged(LetterDelivery delivery, DeliveryStatus oldStatus) {
        var payload = Map.of(
            "type", "DELIVERY_STATUS_CHANGED",
            "deliveryId", delivery.getId(),
            "status", delivery.getStatus().name()
        );

        messagingTemplate.convertAndSend("/topic/deliveries", payload);
    }
}