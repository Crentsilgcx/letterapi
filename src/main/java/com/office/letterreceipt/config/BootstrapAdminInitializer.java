package com.office.letterreceipt.config;

import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.UserAccountRepository;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
public class BootstrapAdminInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminInitializer.class);
    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    @Value("${app.bootstrap.admin-username:admin}")
    private String username;
    @Value("${app.bootstrap.admin-password:}")
    private String password;
    @Value("${app.bootstrap.admin-display-name:System Administrator}")
    private String displayName;

    public BootstrapAdminInitializer(UserAccountRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(password) || password.length() < 12) {
            throw new IllegalStateException(
                "No users exist and APP_BOOTSTRAP_ADMIN_PASSWORD is missing or shorter than 12 characters. "
                    + "Set it and restart to create the first admin.");
        }
        UserAccount admin = new UserAccount();
        admin.setUsername(username.trim().toLowerCase(Locale.ROOT));
        admin.setDisplayName(displayName.trim());
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        users.save(admin);
        log.info(
            "Bootstrap administrator '{}' created. Change its password after first login if the secret was shared.",
            admin.getUsername());
    }
}
