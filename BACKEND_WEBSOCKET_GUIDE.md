# Backend WebSocket Implementation Guide

This document describes the minimal backend changes required to support the WebSocket-based real-time features implemented in the frontend.

## Required WebSocket Endpoints

The frontend expects WebSocket connections at:
- `ws://host/ws/reception` - for receptionist clients
- `ws://host/ws/delivery` - for delivery person clients

## Spring Boot WebSocket Configuration

### 1. Add WebSocket Dependencies

In `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### 2. WebSocket Configuration

Create `WebSocketConfig.java`:
```java
package com.office.letterreceipt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/reception", "/ws/delivery")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

### 3. Message Types

The frontend expects these WebSocket message types:

| Message Type | Direction | Payload | Description |
|--------------|-----------|---------|-------------|
| `DELIVERY_CREATED` | Server → Reception | `{ delivery: DeliveryResponse }` | New delivery submitted |
| `DELIVERY_RECEIVED` | Server → Reception | `{ delivery: DeliveryResponse }` | Delivery marked as received |
| `DELIVERY_STATUS_CHANGED` | Server → Both | `{ deliveryId, newStatus, trackingNumber, delivery?, receivedAt? }` | Status changed |

### 4. Service to Send WebSocket Events

Create `WebSocketEventPublisher.java`:
```java
package com.office.letterreceipt.websocket;

import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class WebSocketEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyDeliveryCreated(LetterDelivery delivery) {
        var response = DeliveryResponse.full(delivery);
        messagingTemplate.convertAndSend("/topic/reception", Map.of(
            "type", "DELIVERY_CREATED",
            "payload", Map.of("delivery", response)
        ));
    }

    public void notifyDeliveryReceived(LetterDelivery delivery) {
        var response = DeliveryResponse.full(delivery);
        messagingTemplate.convertAndSend("/topic/reception", Map.of(
            "type", "DELIVERY_RECEIVED",
            "payload", Map.of("delivery", response)
        ));
    }

    public void notifyStatusChanged(LetterDelivery delivery, DeliveryStatus oldStatus) {
        var payload = Map.of(
            "deliveryId", delivery.getId(),
            "newStatus", delivery.getStatus().name(),
            "trackingNumber", delivery.getTrackingNumber(),
            "delivery", DeliveryResponse.full(delivery),
            "receivedAt", delivery.getReceivedAt()
        );

        // Notify receptionists
        messagingTemplate.convertAndSend("/topic/reception", Map.of(
            "type", "DELIVERY_STATUS_CHANGED",
            "payload", payload
        ));

        // Notify delivery persons (if tracking number available)
        if (delivery.getTrackingNumber() != null) {
            messagingTemplate.convertAndSend("/topic/delivery", Map.of(
                "type", "DELIVERY_STATUS_CHANGED",
                "payload", payload
            ));
        }
    }
}
```

### 5. Integration with DeliveryService

Update `DeliveryService.java` to publish events:

```java
// Add to constructor
private final WebSocketEventPublisher wsPublisher;

public DeliveryService(..., WebSocketEventPublisher wsPublisher) {
    ...
    this.wsPublisher = wsPublisher;
}

// In create() method, after save:
delivery = deliveries.save(delivery);
addEvent(delivery, DeliveryEventType.DELIVERED, person.getFullName(),
    "Letter submitted for receipt confirmation", servletRequest, now);
wsPublisher.notifyDeliveryCreated(delivery);  // ADD THIS
return delivery;

// In receive() method, after save:
try {
    deliveries.save(delivery);
} catch (OptimisticLockingFailureException ex) {
    throw new ResponseStatusException(CONFLICT, "This letter was updated by another user. Refresh and try again.");
}
wsPublisher.notifyDeliveryReceived(delivery);  // ADD THIS
wsPublisher.notifyStatusChanged(delivery, DeliveryStatus.DELIVERED);  // ADD THIS
addEvent(...);
return delivery;
```

### 6. Security (Optional but Recommended)

For production, secure WebSocket endpoints with Spring Security:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages.simpDestMatchers("/ws/**").permitAll()
                .simpDestMatchers("/topic/reception").hasRole("RECEPTIONIST")
                .simpDestMatchers("/topic/delivery").hasRole("DELIVERY_PERSON")
                .anyMessage().authenticated();
    }
}
```

## Frontend Message Format

All messages follow this structure:
```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... }
}
```

## Testing

1. Start the Spring Boot application with WebSocket support
2. Open multiple browser tabs:
   - One at `/reception` (receptionist)
   - One at `/delivery` (delivery person)
3. Submit a delivery from the delivery tab
4. Verify it appears instantly in the reception tab
5. Click "Confirm Receipt" in reception tab
6. Verify delivery status updates instantly in delivery tab

## Connection Handling

The frontend handles:
- Automatic reconnection with exponential backoff (max 10 attempts)
- Connection status indicators in UI
- Cleanup on component unmount
- Duplicate listener prevention using refs

No additional frontend changes needed once backend WebSocket endpoints are available.