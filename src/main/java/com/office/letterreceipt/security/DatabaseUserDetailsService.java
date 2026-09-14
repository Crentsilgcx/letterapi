package com.office.letterreceipt.security;

import com.office.letterreceipt.model.UserAccount;
import com.office.letterreceipt.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserAccountRepository repository;

    public DatabaseUserDetailsService(UserAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = repository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
        return User.withUsername(account.getUsername())
            .password(account.getPasswordHash())
            .roles(account.getRole().name())
            .disabled(!account.isActive())
            .build();
    }
}
