package com.ravtec.delivery.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@lombok.RequiredArgsConstructor
public class HealthController {
    private final javax.sql.DataSource dataSource;

    @GetMapping("/api/health")
    public org.springframework.http.ResponseEntity<Map<String, String>> health() {
        try (var connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return org.springframework.http.ResponseEntity.ok(Map.of("status", "UP", "application", "js-boy-api"));
            }
        } catch (java.sql.SQLException exception) {
            // Only expose dependency availability; connection details are private.
        }
        return org.springframework.http.ResponseEntity.status(503).body(Map.of("status", "DOWN"));
    }
}
