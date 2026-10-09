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
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status) {

        ReportRequest request = buildRequest(dateFrom, dateTo, organization, recipientPosition, status);
        LocalDateTime generatedAt = LocalDateTime.now();

        // Build pageable for large result set (up to MAX_REPORT_RECORDS)
        var pageable = PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt"));

        List<LetterDelivery> records;
        long totalRecords;
        if ("Other".equalsIgnoreCase(organization)) {
            records = deliveries.findAllForReportOtherOrganizations(
                    request.status(),
                    request.recipientPosition(),
                    request.dateFrom(),
                    request.dateTo(),
                    pageable);
            totalRecords = deliveries.countForReportOtherOrganizations(
                    request.status(),
                    request.recipientPosition(),
                    request.dateFrom(),
                    request.dateTo());
        } else {
            records = deliveries.findAllForReport(
                    request.status(),
                    request.recipientPosition(),
                    request.organization(),
                    request.dateFrom(),
                    request.dateTo(),
                    pageable);
            totalRecords = deliveries.countForReport(
                    request.status(),
                    request.recipientPosition(),
                    request.organization(),
                    request.dateFrom(),
                    request.dateTo());
        }

        List<DeliveryResponse> responseRecords = records.stream()
                .map(DeliveryResponse::full)
                .toList();

        return new ReportResponse(responseRecords, totalRecords, request, generatedAt);
    }

    @GetMapping("/export/csv")
    public void exportCsv(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {

        ReportRequest request = buildRequest(dateFrom, dateTo, organization, recipientPosition, status);

        List<LetterDelivery> records;
        if ("Other".equalsIgnoreCase(organization)) {
            records = deliveries.findAllForReportOtherOrganizations(
                    request.status(),
                    request.recipientPosition(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        } else {
            records = deliveries.findAllForReport(
                    request.status(),
                    request.recipientPosition(),
                    request.organization(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        }

        String filename = "incoming-letter-report-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".csv";

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        try (var writer = new com.opencsv.CSVWriter(response.getWriter())) {
            // Header
            writer.writeNext(new String[]{
                    "ID", "Reference", "Status", "Delivery Person", "Organization",
                    "Recipient Position", "Subject", "Reference Number",
                    "Delivered At", "Received At", "Received By"
            });

            // Data
            for (LetterDelivery d : records) {
                writer.writeNext(new String[]{
                        String.valueOf(d.getId()),
                        d.getTrackingNumber(),
                        d.getStatus().name(),
                        d.getDeliveryPersonName(),
                        d.getOrganizationName(),
                        d.getRecipientName() + (d.getRecipientTitle() != null ? " (" + d.getRecipientTitle() + ")" : ""),
                        d.getSubject(),
                        d.getReferenceNumber() != null ? d.getReferenceNumber() : "",
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
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {

        ReportRequest request = buildRequest(dateFrom, dateTo, organization, recipientPosition, status);

        List<LetterDelivery> records;
        if ("Other".equalsIgnoreCase(organization)) {
            records = deliveries.findAllForReportOtherOrganizations(
                    request.status(),
                    request.recipientPosition(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        } else {
            records = deliveries.findAllForReport(
                    request.status(),
                    request.recipientPosition(),
                    request.organization(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        }

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

            // Headers row
            var headerRow = sheet.createRow(4);
            String[] headers = {"ID", "Reference", "Status", "Delivery Person", "Organization",
                    "Recipient Position", "Subject", "Reference Number",
                    "Delivered At", "Received At", "Received By"};
            for (int i = 0; i < headers.length; i++) {
                var cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 5;
            for (LetterDelivery d : records) {
                var row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(d.getId());
                row.createCell(1).setCellValue(d.getTrackingNumber());
                row.createCell(2).setCellValue(d.getStatus().name());
                row.createCell(3).setCellValue(d.getDeliveryPersonName());
                row.createCell(4).setCellValue(d.getOrganizationName());
                row.createCell(5).setCellValue(d.getRecipientName() + (d.getRecipientTitle() != null ? " (" + d.getRecipientTitle() + ")" : ""));
                row.createCell(6).setCellValue(d.getSubject());
                row.createCell(7).setCellValue(d.getReferenceNumber() != null ? d.getReferenceNumber() : "");
                row.createCell(8).setCellValue(d.getDeliveredAt() != null ? d.getDeliveredAt().toString() : "");
                row.createCell(9).setCellValue(d.getReceivedAt() != null ? d.getReceivedAt().toString() : "");
                row.createCell(10).setCellValue(d.getReceivedBy() != null ? d.getReceivedBy().getDisplayName() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
        }
    }

    @GetMapping("/export/pdf")
    public void exportPdf(
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String recipientPosition,
            @RequestParam(required = false) String status,
            HttpServletResponse response) throws IOException {

        ReportRequest request = buildRequest(dateFrom, dateTo, organization, recipientPosition, status);

        List<LetterDelivery> records;
        if ("Other".equalsIgnoreCase(organization)) {
            records = deliveries.findAllForReportOtherOrganizations(
                    request.status(),
                    request.recipientPosition(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        } else {
            records = deliveries.findAllForReport(
                    request.status(),
                    request.recipientPosition(),
                    request.organization(),
                    request.dateFrom(),
                    request.dateTo(),
                    PageRequest.of(0, MAX_REPORT_RECORDS, Sort.by(Sort.Direction.DESC, "deliveredAt")));
        }

        String filename = "incoming-letter-report-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".pdf";

        response.setContentType("application/pdf");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        try (var pdfDocument = new com.itextpdf.kernel.pdf.PdfDocument(new com.itextpdf.kernel.pdf.PdfWriter(response.getOutputStream()));
             var document = new com.itextpdf.layout.Document(pdfDocument)) {

            // Font
            var font = com.itextpdf.kernel.font.PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);
            var boldFont = com.itextpdf.kernel.font.PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);

            // Title
            var title = new com.itextpdf.layout.element.Paragraph("INCOMING LETTER REPORT")
                    .setFont(boldFont)
                    .setFontSize(16)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                    .setMarginBottom(8);
            document.add(title);

            // Period
            var period = new com.itextpdf.layout.element.Paragraph("Period: " + buildPeriodString(request))
                    .setFont(font)
                    .setFontSize(10)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                    .setMarginBottom(4);
            document.add(period);

            // Generated
            var generated = new com.itextpdf.layout.element.Paragraph("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .setFont(font)
                    .setFontSize(10)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                    .setMarginBottom(16);
            document.add(generated);

            // Table - use UnitValue for percentage-based column widths to ensure proper fitting
            // Normalized to sum to 100% for iText7
            float[] columnWidths = {4.2f, 10f, 6.7f, 10f, 10f, 10f, 12.5f, 6.7f, 10f, 10f, 10f}; // percentages sum to 100
            var table = new com.itextpdf.layout.element.Table(com.itextpdf.layout.properties.UnitValue.createPercentArray(columnWidths))
                    .useAllAvailableWidth()
                    .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);

            // Ensure table splits across pages properly
            table.setKeepTogether(false);

            // Header row
            String[] headers = {"ID", "Reference", "Status", "Delivery Person", "Organization",
                    "Recipient", "Subject", "Ref #", "Delivered", "Received", "Received By"};
            for (String header : headers) {
                table.addHeaderCell(new com.itextpdf.layout.element.Cell()
                        .add(new com.itextpdf.layout.element.Paragraph(header).setFont(boldFont).setFontSize(7))
                        .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                        .setPadding(3)
                        .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
            }

            // Data rows
            for (LetterDelivery d : records) {
                table.addCell(createCell(String.valueOf(d.getId()), font));
                table.addCell(createCell(d.getTrackingNumber(), font));
                table.addCell(createCell(d.getStatus().name(), font));
                table.addCell(createCell(d.getDeliveryPersonName(), font));
                table.addCell(createCell(d.getOrganizationName(), font));
                table.addCell(createCell(d.getRecipientName() + (d.getRecipientTitle() != null ? " (" + d.getRecipientTitle() + ")" : ""), font));
                table.addCell(createCell(d.getSubject(), font));
                table.addCell(createCell(d.getReferenceNumber() != null ? d.getReferenceNumber() : "", font));
                table.addCell(createCell(d.getDeliveredAt() != null ? d.getDeliveredAt().toString() : "", font));
                table.addCell(createCell(d.getReceivedAt() != null ? d.getReceivedAt().toString() : "", font));
                table.addCell(createCell(d.getReceivedBy() != null ? d.getReceivedBy().getDisplayName() : "", font));
            }

            document.add(table);
        }
    }

    private com.itextpdf.layout.element.Cell createCell(String text, com.itextpdf.kernel.font.PdfFont font) {
        return new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(text != null ? text : "").setFont(font).setFontSize(7))
                .setPadding(3)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.LEFT);
    }

    private ReportRequest buildRequest(String dateFrom, String dateTo, String organization, String recipientPosition, String status) {
        LocalDateTime from = parseDate(dateFrom);
        LocalDateTime to = parseDateToEndOfDay(dateTo);
        DeliveryStatus deliveryStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                deliveryStatus = DeliveryStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return new ReportRequest(from, to, blankToNull(organization), blankToNull(recipientPosition), deliveryStatus);
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
        if (request.organization() != null) {
            sb.append(" | Organization: ").append(request.organization());
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