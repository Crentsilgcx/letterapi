package com.office.letterreceipt;

import com.office.letterreceipt.support.AbstractSpringIT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnabledIf("com.office.letterreceipt.support.DockerAvailability#available")
class SecurityMvcIT extends AbstractSpringIT {
    @Autowired
    MockMvc mockMvc;

    @Test
    void anonymousWebStaffPagesRedirectToLogin() throws Exception {
        mockMvc.perform(get("/admin"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrlPattern("**/login"));
        mockMvc.perform(get("/reception"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrlPattern("**/login"));
    }

    @Test
    void publicApiIsOpenAndDoesNotExposeCourierContact() throws Exception {
        mockMvc.perform(get("/api/public/recipients"))
            .andExpect(status().isOk());
        mockMvc.perform(get("/"))
            .andExpect(status().isOk())
            .andExpect(content().string(not(containsString("data-phone"))))
            .andExpect(content().string(not(containsString("data-email"))));
        mockMvc.perform(post("/api/public/deliveries")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void staffApisRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/recipients"))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reception/deliveries/pending"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void receptionistCannotOpenAdminButCanOpenReception() throws Exception {
        mockMvc.perform(get("/admin").with(user("reception").roles("RECEPTIONIST")))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/reception").with(user("reception").roles("RECEPTIONIST")))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/recipients").with(httpBasic("admin", "wrong-password")))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanOpenAdminAndAdminApi() throws Exception {
        mockMvc.perform(get("/admin").with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk());
        mockMvc.perform(get("/reception").with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/recipients").with(httpBasic("admin", "test-admin-password-123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
