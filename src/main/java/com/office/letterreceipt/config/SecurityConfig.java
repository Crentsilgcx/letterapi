package com.office.letterreceipt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * Security configuration for the Letter Receipt System.
 * 
 * This configuration is structured to support future SSO/OIDC integration while
 * maintaining the current username/password authentication.
 * 
 * Current authentication methods:
 * - API endpoints (/api/**): HTTP Basic authentication (stateless)
 * - Web endpoints (/**): Form-based login with session
 * 
 * Future SSO/OIDC integration points (not yet implemented):
 * - OAuth2/OIDC login for /reception/** endpoints
 * - JWT token validation for API endpoints
 * - Identity provider metadata configuration
 * - User identity mapping from external IdP to application users
 * 
 * When the organization's Identity Provider is specified, the following
 * changes will be needed:
 * 1. Add spring-boot-starter-oauth2-client dependency
 * 2. Configure OAuth2 client registration (issuer-uri, client-id, client-secret)
 * 3. Add OAuth2LoginConfigurer to webSecurity filter chain for /reception/**
 * 4. Add JwtAuthenticationConverter for API token validation
 * 5. Implement OAuth2UserService to map external identity to UserAccount
 * 6. Add optional 'externalId' field to UserAccount for stable IdP subject mapping
 */
@Configuration
public class SecurityConfig {

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    @Order(1)
    SecurityFilterChain websocketSecurity(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/ws/**")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable());
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain apiSecurity(HttpSecurity http, UserDetailsService userDetailsService) throws Exception {
        http
            .securityMatcher("/api/**")
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers("/api/admin/me").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/reception/**").hasAnyRole("ADMIN", "RECEPTIONIST")
                .anyRequest().authenticated())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(Customizer.withDefaults());
            
            // FUTURE SSO: When OIDC is configured, replace .httpBasic() with:
            // .oauth2ResourceServer(oauth2 -> oauth2
            //     .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
            // And add a JwtAuthenticationConverter bean to map JWT claims to authorities.
        return http.build();
    }

    @Bean
    @Order(3)
    SecurityFilterChain webSecurity(HttpSecurity http, UserDetailsService userDetailsService) throws Exception {
        http
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/deliver",
                    "/track",
                    "/track/**",
                    "/css/**",
                    "/js/**",
                    "/favicon.svg",
                    "/error",
                    "/actuator/health")
                .permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/reception/**", "/operations/**").hasAnyRole("ADMIN", "RECEPTIONIST")
                .anyRequest().authenticated())
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/operations", true)
                .permitAll())
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "XSRF-TOKEN"));
            
            // FUTURE SSO: When OIDC is configured for Reception, add:
            // .oauth2Login(oauth2 -> oauth2
            //     .loginPage("/reception/login")
            //     .authorizationEndpoint(auth -> auth.baseUri("/oauth2/authorize"))
            //     .redirectionEndpoint(redir -> redir.baseUri("/login/oauth2/code/*"))
            //     .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOidcUserService()))
            //     .successHandler(oauth2AuthenticationSuccessHandler()))
            // And implement CustomOidcUserService and OAuth2AuthenticationSuccessHandler.
        return http.build();
    }
    
    // FUTURE SSO: Bean for JWT authentication converter when OIDC is enabled
    /*
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // Map JWT claims (e.g., "roles", "groups") to Spring Security authorities
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            Claim rolesClaim = jwt.getClaim("roles");
            if (rolesClaim != null && rolesClaim.isArray()) {
                rolesClaim.asArray(String.class).forEach(role -> 
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())));
            }
            return authorities;
        });
        return converter;
    }
    */
    
    // FUTURE SSO: Bean for custom OIDC user service when OIDC is enabled
    /*
    @Bean
    OAuth2UserService<OidcUserRequest, OidcUser> customOidcUserService() {
        return userRequest -> {
            OidcUser oidcUser = new OidcUserService().loadUser(userRequest);
            // Map external identity (oidcUser.getSubject()) to UserAccount
            // Create or update UserAccount with externalId = oidcUser.getSubject()
            // Return mapped user with application roles
            return oidcUser;
        };
    }
    */
    
    // FUTURE SSO: Bean for OAuth2 authentication success handler when OIDC is enabled
    /*
    @Bean
    AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler() {
        return (request, response, authentication) -> {
            // Redirect to reception dashboard after successful SSO login
            response.sendRedirect("/reception/dashboard");
        };
    }
    */
}
