package com.trading.engine.controller;

import com.trading.engine.service.GeminiService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String userMessage = request.get("message");
        
        String aiResponse = geminiService.getAiResponse(username, userMessage);
        
        return Map.of("response", aiResponse);
    }
}
