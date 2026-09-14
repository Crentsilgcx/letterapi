package com.office.letterreceipt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.repository.UserAccountRepository;
import com.office.letterreceipt.service.AdminService;
import com.office.letterreceipt.support.AbstractSpringIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnabledIf("com.office.letterreceipt.support.DockerAvailability#available")
class DeliveryFlowIT extends AbstractSpringIT {
    private static final String ADMIN = "admin";
    private static final String ADMIN_PASSWORD = "test-admin-password-123";
    private static final String RECEPTION = "reception";
    private static final String RECEPTION_PASSWORD = "receptionist-password-123";
    private static final String TRACKING = "[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}";

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    AdminService adminService;
    @Autowired
    UserAccountRepository users;

    @BeforeEach
    void receptionist() {
        if (users.findByUsernameIgnoreCase(RECEPTION).isEmpty()) {
            adminService.createUser(RECEPTION, "Front Desk", RECEPTION_PASSWORD, Role.RECEPTIONIST);
        }
    }

    @Test
    void createReceiveAndTrack() throws Exception {
        String recipientName = "Flow Recipient " + System.nanoTime();
        MvcResult createdRecipient = mockMvc.perform(post("/api/admin/recipients")
                .with(httpBasic(ADMIN, ADMIN_PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName":"%s","jobTitle":"Director","department":"Office","active":true,"sortOrder":10}
                    """.formatted(recipientName)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.fullName").value(recipientName))
            .andExpect(jsonPath("$.createdAt").doesNotExist())
            .andReturn();
        long recipientId = objectMapper.readTree(createdRecipient.getResponse().getContentAsByteArray())
            .get("id").asLong();

        MvcResult created = mockMvc.perform(post("/api/public/deliveries")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fullName":"Kwame Mensah",
                      "phone":"0200000000",
                      "email":"kwame@example.com",
                      "organizationName":"Example Ministry",
                      "recipientId":%d,
                      "subject":"Request for Information",
                      "referenceNumber":"REF-100"
                    }
                    """.formatted(recipientId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.trackingNumber", matchesPattern(TRACKING)))
            .andExpect(jsonPath("$.trackingNumber", not(matchesPattern("LTR-\\d{4}-\\d+"))))
            .andExpect(jsonPath("$.status").value("DELIVERED"))
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        JsonNode createdJson = objectMapper.readTree(created.getResponse().getContentAsByteArray());
        String tracking = createdJson.get("trackingNumber").asText();
        long deliveryId = createdJson.get("id").asLong();

        mockMvc.perform(get("/api/public/deliveries/{tracking}", tracking))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.trackingNumber").value(tracking))
            .andExpect(jsonPath("$.status").value("DELIVERED"))
            .andExpect(jsonPath("$.recipientName").value(recipientName))
            .andExpect(jsonPath("$.deliveryPersonName").value(nullValue()))
            .andExpect(jsonPath("$.organizationName").value(nullValue()))
            .andExpect(jsonPath("$.subject").value(nullValue()))
            .andExpect(jsonPath("$.id").value(nullValue()));

        mockMvc.perform(get("/api/public/delivery-persons"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").exists())
            .andExpect(jsonPath("$[0].phone").doesNotExist())
            .andExpect(jsonPath("$[0].email").doesNotExist());

        mockMvc.perform(post("/api/reception/deliveries/{id}/receive", deliveryId)
                .with(httpBasic(RECEPTION, RECEPTION_PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"remarks\":\"Verified at desk\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("RECEIVED"))
            .andExpect(jsonPath("$.receivedBy").value("Front Desk"));

        mockMvc.perform(get("/api/public/deliveries/{tracking}", tracking))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("RECEIVED"))
            .andExpect(jsonPath("$.receivedAt").isNotEmpty())
            .andExpect(jsonPath("$.receivedBy").value(nullValue()));
    }
}
