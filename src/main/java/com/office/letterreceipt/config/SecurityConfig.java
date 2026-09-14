package com.office.letterreceipt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain staffApiSecurity(HttpSecurity http, UserDetailsService userDetailsService) throws Exception {
        http
            .securityMatcher("/api/reception/**", "/api/admin/**")
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/reception/**").hasAnyRole("ADMIN", "RECEPTIONIST")
                .anyRequest().authenticated())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain webSecurity(HttpSecurity http, UserDetailsService userDetailsService) throws Exception {
        http
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/deliver",
                    "/track",
                    "/track/**",
                    "/api/public/**",
                    "/css/**",
                    "/js/**",
                    "/favicon.svg",
                    "/error",
                    "/actuator/health")
                .permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/reception/**").hasAnyRole("ADMIN", "RECEPTIONIST")
                .anyRequest().authenticated())
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/public/**"))
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/reception", true)
                .permitAll())
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "XSRF-TOKEN"));
        return http.build();
    }
}
