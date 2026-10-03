package com.office.letterreceipt.dto;

import com.office.letterreceipt.model.DeliveryStatus;
import java.time.LocalDateTime;

public record ReportRequest(
        LocalDateTime dateFrom,
        LocalDateTime dateTo,
        String organization,
        String recipientPosition,
        DeliveryStatus status) {
}