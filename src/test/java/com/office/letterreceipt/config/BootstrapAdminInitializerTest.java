package com.office.letterreceipt.config;

import com.office.letterreceipt.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
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
}
