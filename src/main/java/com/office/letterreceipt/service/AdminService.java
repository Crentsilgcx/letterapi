package com.office.letterreceipt.service;

import com.office.letterreceipt.model.Role;
import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.UserAccountRepository;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AdminService {
    private final UserAccountRepository users;
    private final PasswordEncoder encoder;

    public AdminService(UserAccountRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional
    public UserAccount createUser(String username, String displayName, String password, Role role) {
        if (!StringUtils.hasText(username)
                || !StringUtils.hasText(displayName)
                || !StringUtils.hasText(password)
                || password.length() < 12
                || password.length() > 72) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Username, display name and a password of 12 to 72 characters are required.");
        }
        if (users.findByUsernameIgnoreCase(username.trim()).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "Username already exists.");
        }
        UserAccount user = new UserAccount();
        user.setUsername(username.trim().toLowerCase(Locale.ROOT));
        user.setDisplayName(displayName.trim());
        user.setPasswordHash(encoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        return users.save(user);
    }

    @Transactional
    public void toggleUser(Long id) {
        UserAccount user = users.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        if (user.isActive() && user.getRole() == Role.ADMIN && users.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new ResponseStatusException(BAD_REQUEST, "The last active administrator cannot be disabled.");
        }
        user.setActive(!user.isActive());
        users.save(user);
    }

    @Transactional
    public void resetPassword(Long id, String password) {
        if (password == null || password.length() < 12 || password.length() > 72) {
            throw new ResponseStatusException(BAD_REQUEST, "Password must be 12 to 72 characters.");
        }
        UserAccount user = users.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
    }
}