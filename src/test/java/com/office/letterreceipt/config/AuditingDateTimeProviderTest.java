package com.office.letterreceipt.config;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.data.auditing.DateTimeProvider;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuditingDateTimeProviderTest {
    @Test
    void usesConfiguredClockInsteadOfJvmDefaultZone() {
        Clock clock = Clock.fixed(Instant.parse("2026-09-14T23:30:00Z"), ZoneOffset.ofHours(12));
        DateTimeProvider provider = new AppConfig().auditingDateTimeProvider(clock);
        LocalDateTime stamped = LocalDateTime.from(provider.getNow().orElseThrow());
        assertEquals(LocalDateTime.of(2026, 9, 15, 11, 30), stamped);
    }
}
