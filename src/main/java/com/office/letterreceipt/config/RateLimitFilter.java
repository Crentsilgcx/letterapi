package com.office.letterreceipt.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final boolean enabled;
    private final int loginPerMinute;
    private final int publicPostPerMinute;

    public RateLimitFilter(
            @Value("${app.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.rate-limit.login-per-minute:8}") int loginPerMinute,
            @Value("${app.rate-limit.public-post-per-minute:40}") int publicPostPerMinute) {
        this.enabled = enabled;
        this.loginPerMinute = loginPerMinute;
        this.publicPostPerMinute = publicPostPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!enabled || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        int limit;
        String kind;
        if ("/login".equals(path)) {
            limit = loginPerMinute;
            kind = "login";
        } else if ("/api/public/deliveries".equals(path)) {
            limit = publicPostPerMinute;
            kind = "public-post";
        } else {
            filterChain.doFilter(request, response);
            return;
        }

        String key = kind + ":" + request.getRemoteAddr();
        long minute = Instant.now().getEpochSecond() / 60;
        Window window = windows.compute(key, (ignored, existing) -> {
            if (existing == null || existing.minute != minute) {
                return new Window(minute, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (window.count.get() > limit) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            if ("login".equals(kind)) {
                response.setContentType(MediaType.TEXT_PLAIN_VALUE);
                response.getWriter().write("Too many login attempts. Try again in a minute.");
            } else {
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"message\":\"Too many delivery submissions. Try again in a minute.\"}");
            }
            return;
        }

        filterChain.doFilter(request, response);
    }

    private record Window(long minute, AtomicInteger count) {}
}
