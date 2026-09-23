package com.office.letterreceipt.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreateDeliveryRequestTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void blankEmailIsNormalizedToNullAndPassesValidation() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
            "Kwame Mensah", " ", "", "Example Ministry", "123 Main St", "CEO", "Subject", " ", "");
        assertNull(request.email());
        assertNull(request.phone());
        assertNull(request.referenceNumber());
        assertNull(request.description());
        Set<ConstraintViolation<CreateDeliveryRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v -> "email".equals(v.getPropertyPath().toString())));
    }

    @Test
    void invalidEmailStillFailsValidation() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
            "Kwame Mensah", null, "not-an-email", "Example Ministry", null, "CEO", "Subject", null, null);
        Set<ConstraintViolation<CreateDeliveryRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("email", violations.iterator().next().getPropertyPath().toString());
    }
}