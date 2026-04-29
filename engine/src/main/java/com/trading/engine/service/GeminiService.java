package com.trading.engine.service;

import com.trading.engine.entity.PortfolioEntity;
import com.trading.engine.entity.UserEntity;
import com.trading.engine.model.Trade;
import com.trading.engine.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.math.BigDecimal;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final PortfolioService portfolioService;
    private final OrderService orderService;
    private final UserRepository userRepository;

    public GeminiService(PortfolioService portfolioService, 
                         OrderService orderService,
                         UserRepository userRepository) {
        this.portfolioService = portfolioService;
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    public String getAiResponse(String identifier, String userMessage) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.contains("PASTE")) {
            return "Gemini API Key is missing. Please configure it in application.properties.";
        }

        // 1. Get User Profile Context
        Optional<UserEntity> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }
        String realName = userOpt.map(UserEntity::getUsername).orElse("Trader");

        // 2. Get Market & Portfolio Context
        List<PortfolioEntity> portfolio = portfolioService.getPortfolio(identifier);
        List<Trade> allTrades = orderService.getTrades();
        
        BigDecimal currentPrice = allTrades.isEmpty() ? BigDecimal.ZERO : allTrades.get(allTrades.size() - 1).getPrice();

        // 3. Build the System Prompt
        StringBuilder context = new StringBuilder();
        context.append("You are the Stockify AI Strategist, a world-class financial expert and general-purpose assistant. ");
        context.append("Your mission is to help ").append(realName).append(" with anything they need—whether it's trading advice, general knowledge, or platform support. ");
        context.append("Current Market Data: BTC is trading at $").append(currentPrice).append(". ");
        
        context.append("\nUser's Personal Data (ONLY share if they ask about their account): ");
        context.append("Holdings: ");
        for (PortfolioEntity p : portfolio) {
            context.append(p.getAsset()).append(": ").append(p.getQuantity()).append(" (Avg Buy Price: $").append(p.getAvgPrice()).append("). ");
        }

        context.append("\nRecent Activity: ");
        int tradeCount = 0;
        for (Trade t : allTrades) {
            if (t.getBuyerUsername().equalsIgnoreCase(identifier) || t.getSellerUsername().equalsIgnoreCase(identifier)) {
                String side = t.getBuyerUsername().equalsIgnoreCase(identifier) ? "BUY" : "SELL";
                // Simplified formatting to avoid type issues
                context.append("[").append(side).append(" ").append(t.getQuantity()).append(" BTC at $").append(t.getPrice()).append("], ");
                tradeCount++;
                if (tradeCount > 5) break;
            }
        }
        
        context.append("\nINSTRUCTIONS: ");
        context.append("1. Answer ANY question the user asks (General knowledge, math, coding, etc.). ");
        context.append("2. Use the 'User's Personal Data' to give personalized financial insights if relevant. ");
        context.append("3. STRICT RULE: Only answer exactly what the user asks. Do not provide extra context, unsolicited advice, or general platform information unless directly relevant to the question. ");
        context.append("4. Be extremely concise. If the user asks for a number, give only the number and a brief explanation. ");
        context.append("5. If the user asks to perform a trade, explain that you are an information assistant and they should use the 'Trade' tab for security.");

        // 4. Call Gemini API
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        
        Map<String, String> part = new HashMap<>();
        part.put("text", context.toString() + "\nUser Question: " + userMessage);
        
        userContent.put("parts", List.of(part));
        contents.add(userContent);
        requestBody.put("contents", contents);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates == null || candidates.isEmpty()) {
                    return "AI didn't provide a response. (Safety filter?)";
                }
                Map firstCandidate = (Map) candidates.get(0);
                Map contentObj = (Map) firstCandidate.get("content");
                List parts = (List) contentObj.get("parts");
                Map firstPart = (Map) parts.get(0);
                return (String) firstPart.get("text");
            }
            return "AI Error: HTTP " + response.getStatusCode();
        } catch (Exception e) {
            System.err.println("❌ Gemini API Error: " + e.getMessage());
            return "Error talking to AI. Please try again later.";
        }
    }
}
