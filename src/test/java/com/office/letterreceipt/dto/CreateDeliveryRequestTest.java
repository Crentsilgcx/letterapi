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
            "Kwame Mensah", " ", "");
        assertNull(request.email());
        assertNull(request.phone());
        Set<ConstraintViolation<CreateDeliveryRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().noneMatch(v -> "email".equals(v.getPropertyPath().toString())));
    }

    @Test
    void invalidEmailStillFailsValidation() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
            "Kwame Mensah", null, "not-an-email");
        Set<ConstraintViolation<CreateDeliveryRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("email", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void fullNameIsRequired() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
            "", "0200000000", "kwame@example.com");
        Set<ConstraintViolation<CreateDeliveryRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("fullName", violations.iterator().next().getPropertyPath().toString());
    }
}