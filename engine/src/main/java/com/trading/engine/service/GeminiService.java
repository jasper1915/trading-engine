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

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
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
        
        // 3. Build the System Prompt
        StringBuilder context = new StringBuilder();
        context.append("You are the Stockify AI Strategist, a world-class financial expert. ");
        context.append("Current Date and Time: ").append(java.time.LocalDateTime.now()).append(". ");
        context.append("Your mission is to help ").append(realName).append(" with trading advice, general knowledge, or platform support. ");
        
        context.append("\nMARKET OVERVIEW: ");
        context.append("Platform supports Crypto (USD) and Indian Stocks (INR). ");
        
        context.append("\nUser's Personal Data: ");
        context.append("Portfolio Holdings: ");
        for (PortfolioEntity p : portfolio) {
            boolean isCrypto = List.of("BTC", "ETH", "SOL", "BNB", "XRP").contains(p.getAsset().toUpperCase());
            String sym = isCrypto ? "$" : "₹";
            context.append(p.getAsset()).append(": ").append(p.getQuantity())
                   .append(" (Avg Buy: ").append(sym).append(p.getAvgPrice()).append("). ");
        }

        context.append("\nRecent Activity (Last 5 Trades): ");
        int tradeCount = 0;
        for (Trade t : allTrades) {
            if (t.getBuyerUsername().equalsIgnoreCase(identifier) || t.getSellerUsername().equalsIgnoreCase(identifier)) {
                String side = t.getBuyerUsername().equalsIgnoreCase(identifier) ? "BUY" : "SELL";
                boolean isCrypto = List.of("BTC", "ETH", "SOL", "BNB", "XRP").contains(t.getSymbol().toUpperCase());
                String sym = isCrypto ? "$" : "₹";
                
                context.append("[").append(side).append(" ").append(t.getQuantity()).append(" ")
                       .append(t.getSymbol()).append(" at ").append(sym).append(t.getPrice()).append("], ");
                
                tradeCount++;
                if (tradeCount >= 5) break;
            }
        }
        
        context.append("\nSTRICT RULES FOR ABSOLUTE CONCISENESS: ");
        context.append("1. Answer ANY question (General or App-specific) with MAXIMUM brevity. ");
        context.append("2. ZERO CONVERSATIONAL FILLER: Never say 'Hello', 'Certainly', 'I understand', or 'As an AI'. Start immediately with the answer. ");
        context.append("3. NO IRRELEVANT CONTENT: Provide only the facts or data requested. Do not add context unless it is essential for the answer's accuracy. ");
        context.append("4. If the user asks for account data, provide ONLY the data. ");
        context.append("5. Limit all responses to 1-2 sentences unless the user specifically asks for a detailed explanation.");

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
            e.printStackTrace();
            return "AI Error: " + e.getMessage();
        }
    }
}
