package com.office.letterreceipt.api;

import com.office.letterreceipt.dto.DeliveryResponse;
import com.office.letterreceipt.dto.ReportRequest;
import com.office.letterreceipt.dto.ReportResponse;
import com.office.letterreceipt.model.DeliveryStatus;
import com.office.letterreceipt.model.LetterDelivery;
import com.office.letterreceipt.repository.LetterDeliveryRepository;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reception/reports")
public class ReportController {

    private static final int MAX_REPORT_RECORDS = 50000;
    private final LetterDeliveryRepository deliveries;

    public ReportController(LetterDeliveryRepository deliveries) {
        this.deliveries = deliveries;
    }

    @PostMapping("/generate")
    public ReportResponse generateReport(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status) {

        ReportRequest request = buildRequest(dateFrom, dateTo, recipientPosition, status);
        LocalDateTime generatedAt = LocalDateTime.now();

        // Build pageable for large result set (up to MAX_REPORT_RECORDS)
        var pageable = PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt"));

        List<LetterDelivery> records = deliveries.findAllForReport(
                request.status(),
                request.recipientPosition(),
                request.dateFrom(),
                request.dateTo(),
                pageable);
        long totalRecords = deliveries.countForReport(
                request.status(),
                request.recipientPosition(),
                request.dateFrom(),
                request.dateTo());

        List<DeliveryResponse> responseRecords = records.stream()
                .map(DeliveryResponse::full)
                .toList();

        return new ReportResponse(responseRecords, totalRecords, request, generatedAt);
    }

    @GetMapping("/export/csv")
    public void exportCsv(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {

        ReportRequest request = buildRequest(dateFrom, dateTo, recipientPosition, status);

        List<LetterDelivery> records = deliveries.findAllForReport(
                request.status(),
                request.recipientPosition(),
                request.dateFrom(),
                request.dateTo(),
                PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));

        String filename = "incoming-letter-report-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv";

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        try (var writer = new com.opencsv.CSVWriter(response.getWriter())) {
            // Header - removed Organization, Subject, Reference Number
            writer.writeNext(new String[]{
                    "ID", "Reference", "Status", "Delivery Person",
                    "Recipient", "Delivered At", "Received At", "Received By"
            });

            // Data - removed organizationName, subject, referenceNumber
            for (LetterDelivery d : records) {
                writer.writeNext(new String[]{
                        String.valueOf(d.getId()),
                        d.getTrackingNumber(),
                        d.getStatus().name(),
                        d.getDeliveryPersonName(),
                        d.getRecipientTitle() != null ? d.getRecipientTitle() : "",
                        d.getDeliveredAt() != null ? d.getDeliveredAt().toString() : "",
                        d.getReceivedAt() != null ? d.getReceivedAt().toString() : "",
                        d.getReceivedBy() != null ? d.getReceivedBy().getDisplayName() : ""
                });
            }
        }
    }

    @GetMapping("/export/excel")
    public void exportExcel(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {

        ReportRequest request = buildRequest(dateFrom, dateTo, recipientPosition, status);

        List<LetterDelivery> records = deliveries.findAllForReport(
                request.status(),
                request.recipientPosition(),
                request.dateFrom(),
                request.dateTo(),
                PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));

        String filename = "incoming-letter-report-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".xlsx";

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             var os = response.getOutputStream()) {

            var sheet = workbook.createSheet("Incoming Letters Report");

            // Header style
            var headerStyle = workbook.createCellStyle();
            var headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Title row
            var titleRow = sheet.createRow(0);
            var titleCell = titleRow.createCell(0);
            titleCell.setCellValue("INCOMING LETTER REPORT");
            titleCell.setCellStyle(headerStyle);

            // Period row
            var periodRow = sheet.createRow(1);
            var periodCell = periodRow.createCell(0);
            String periodStr = buildPeriodString(request);
            periodCell.setCellValue("Period: " + periodStr);

            // Generated row
            var genRow = sheet.createRow(2);
            var genCell = genRow.createCell(0);
            genCell.setCellValue("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            // Headers row - removed Organization, Subject, Reference Number
            var headerRow = sheet.createRow(4);
            String[] headers = {"ID", "Reference", "Status", "Delivery Person",
                    "Recipient", "Delivered At", "Received At", "Received By"};
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows - removed organizationName, subject, referenceNumber
            int rowNum = 5;
            for (LetterDelivery d : records) {
                var row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(d.getId());
                row.createCell(1).setCellValue(d.getTrackingNumber());
                row.createCell(2).setCellValue(d.getStatus().name());
                row.createCell(3).setCellValue(d.getDeliveryPersonName());
                row.createCell(4).setCellValue(d.getRecipientTitle() != null ? d.getRecipientTitle() : "");
                row.createCell(5).setCellValue(d.getDeliveredAt() != null ? d.getDeliveredAt().toString() : "");
                row.createCell(6).setCellValue(d.getReceivedAt() != null ? d.getReceivedAt().toString() : "");
                row.createCell(7).setCellValue(d.getReceivedBy() != null ? d.getReceivedBy().getDisplayName() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
        }
    }

    private com.itextpdf.layout.element.Cell createCell(String text, com.itextpdf.kernel.font.PdfFont font) {
        return new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(text != null ? text : "").setFont(font).setFontSize(7))
                .setPadding(3)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.LEFT);
    }

    private ReportRequest buildRequest(String dateFrom, String dateTo, String recipientPosition, String status) {
        LocalDateTime from = parseDate(dateFrom);
        LocalDateTime to = parseDateToEndOfDay(dateTo);
        DeliveryStatus deliveryStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                deliveryStatus = DeliveryStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return new ReportRequest(from, to, blankToNull(recipientPosition), deliveryStatus);
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDateTime.parse(dateStr + "T00:00:00");
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateToEndOfDay(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDateTime.parse(dateStr + "T23:59:59");
        } catch (Exception e) {
            return null;
        }
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private String buildPeriodString(ReportRequest request) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM d, yyyy");
        StringBuilder sb = new StringBuilder();
        if (request.dateFrom() != null) {
            sb.append(request.dateFrom().format(fmt));
        } else {
            sb.append("All time");
        }
        sb.append(" – ");
        if (request.dateTo() != null) {
            sb.append(request.dateTo().format(fmt));
        } else {
            sb.append("Present");
        }
        if (request.recipientPosition() != null) {
            sb.append(" | Recipient: ").append(request.recipientPosition());
        }
        if (request.status() != null) {
            sb.append(" | Status: ").append(request.status().name());
        }
        return sb.toString();
    }
}