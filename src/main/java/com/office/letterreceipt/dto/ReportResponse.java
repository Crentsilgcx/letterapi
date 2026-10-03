package com.office.letterreceipt.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ReportResponse(
        List<DeliveryResponse> records,
        long totalRecords,
        ReportRequest filters,
        LocalDateTime generatedAt) {
}