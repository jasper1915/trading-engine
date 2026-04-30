package com.trading.engine.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP",
            "message", "Stockify Engine is running",
            "timestamp", String.valueOf(System.currentTimeMillis())
        );
    }
}
