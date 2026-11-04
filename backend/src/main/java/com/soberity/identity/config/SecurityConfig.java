package com.soberity.identity.config;

import com.soberity.common.web.ProblemResponseWriter;
import com.soberity.identity.security.FirebaseAuthenticationFilter;
import com.soberity.identity.security.FirebaseAuthenticationToken;
import com.soberity.identity.token.TokenVerifier;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless API security. Firebase ID tokens are verified by {@link FirebaseAuthenticationFilter}. Every
 * private {@code /api/v1/**} request requires a verified e-mail ({@code ROLE_USER}); anonymous requests get 401 and
 * unverified users get 403.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ProblemResponseWriter problems,
            CorsConfigurationSource corsConfigurationSource, TokenVerifier tokenVerifier) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())
                .headers(headers -> headers.cacheControl(Customizer.withDefaults()))
                .addFilterBefore(new FirebaseAuthenticationFilter(tokenVerifier),
                        UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness")
                        .permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/science/categories", "/api/v1/science/feed", "/api/v1/science/articles",
                                "/api/v1/science/articles/*", "/api/v1/science/posts", "/api/v1/science/posts/*",
                                "/api/v1/science/media/*", "/api/v1/evidence/claims",
                                "/api/v1/evidence/claims/*", "/api/v1/evidence/claims/*/citations",
                                "/api/v1/evidence/sources/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/discover/weekly/current", "/api/v1/discover/weekly/*").permitAll()
                        .requestMatchers("/api/v1/discover/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/events", "/api/v1/events/categories",
                                "/api/v1/events/*", "/api/v1/events/media/*", "/api/v1/organizers/*").permitAll()
                        .requestMatchers("/api/v1/events/**", "/api/v1/organizers/**").denyAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/learning/quizzes", "/api/v1/learning/quizzes/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/learning/quizzes/*/answers").permitAll()
                        .requestMatchers("/api/v1/learning/**").denyAll()
                        .requestMatchers("/api/v1/editorial/**").hasRole("USER")
                        .requestMatchers("/api/v1/science/**", "/api/v1/evidence/**").denyAll()
                        .requestMatchers("/api/v1/**").hasRole("USER")
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                problems.write(response, HttpStatus.UNAUTHORIZED, "Unauthorized",
                                        "Authentication is required."))
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            if (isUnverified()) {
                                problems.write(response, HttpStatus.FORBIDDEN, "Forbidden",
                                        "Email verification is required.");
                            } else {
                                problems.write(response, HttpStatus.FORBIDDEN, "Forbidden",
                                        "Access is denied.");
                            }
                        }));
        return http.build();
    }

    private static boolean isUnverified() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> FirebaseAuthenticationToken.ROLE_UNVERIFIED.equals(a.getAuthority()));
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(List.of(
                HttpMethod.GET.name(), HttpMethod.POST.name(), HttpMethod.PUT.name(),
                HttpMethod.PATCH.name(), HttpMethod.DELETE.name(), HttpMethod.OPTIONS.name()));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Correlation-Id", "If-None-Match"));
        configuration.setExposedHeaders(List.of("X-Correlation-Id", "ETag"));
        configuration.setMaxAge(600L);
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
