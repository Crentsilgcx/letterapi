package com.office.letterreceipt.config;

import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.UserAccountRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BootstrapAdminInitializerTest {
    @Test
    void failsWhenNoUsersExistAndPasswordIsMissing() {
        UserAccountRepository users = mock(UserAccountRepository.class);
        when(users.count()).thenReturn(0L);
        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(users, mock(PasswordEncoder.class));
        ReflectionTestUtils.setField(initializer, "username", "admin");
        ReflectionTestUtils.setField(initializer, "password", "");
        ReflectionTestUtils.setField(initializer, "displayName", "System Administrator");
        assertThrows(IllegalStateException.class, () -> initializer.run(mock(ApplicationArguments.class)));
    }

    @Test
    void updatesExistingAdminPasswordWhenEnvironmentPasswordChanged() {
        UserAccountRepository users = mock(UserAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserAccount admin = existingAdmin("old-hash");
        when(users.count()).thenReturn(1L);
        when(users.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(encoder.matches("NewAdminPassword2026", "old-hash")).thenReturn(false);
        when(encoder.encode("NewAdminPassword2026")).thenReturn("new-hash");

        initializer(users, encoder, "NewAdminPassword2026").run(mock(ApplicationArguments.class));

        assertEquals("new-hash", admin.getPasswordHash());
        verify(users).save(admin);
    }

    @Test
    void leavesExistingAdminAloneWhenPasswordAlreadyMatches() {
        UserAccountRepository users = mock(UserAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserAccount admin = existingAdmin("current-hash");
        when(users.count()).thenReturn(1L);
        when(users.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(admin));
        when(encoder.matches("CurrentAdminPassword", "current-hash")).thenReturn(true);

        initializer(users, encoder, "CurrentAdminPassword").run(mock(ApplicationArguments.class));

        assertEquals("current-hash", admin.getPasswordHash());
        verify(users, never()).save(any());
    }

    @Test
    void ignoresTooShortEnvironmentPasswordForExistingAdmin() {
        UserAccountRepository users = mock(UserAccountRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(users.count()).thenReturn(1L);
        when(users.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(existingAdmin("current-hash")));

        initializer(users, encoder, "short").run(mock(ApplicationArguments.class));

        verify(users, never()).save(any());
    }

    private static BootstrapAdminInitializer initializer(UserAccountRepository users, PasswordEncoder encoder, String password) {
        BootstrapAdminInitializer initializer = new BootstrapAdminInitializer(users, encoder);
        ReflectionTestUtils.setField(initializer, "username", "admin");
        ReflectionTestUtils.setField(initializer, "password", password);
        ReflectionTestUtils.setField(initializer, "displayName", "System Administrator");
        return initializer;
    }

    private static UserAccount existingAdmin(String passwordHash) {
        UserAccount admin = new UserAccount();
        admin.setId(1L);
        admin.setUsername("admin");
        admin.setDisplayName("System Administrator");
        admin.setPasswordHash(passwordHash);
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        return admin;
    }
}
