package com.trading.engine.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.List;

@Service
public class MarketDataService {
    private final RestTemplate restTemplate = new RestTemplate();

    public Double getRealTimePrice(String symbol) {
        try {
            // 1. Check if it's Crypto
            if (isCrypto(symbol)) {
                String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol.toUpperCase() + "USDT";
                Map<String, String> response = restTemplate.getForObject(url, Map.class);
                return response != null ? Double.parseDouble(response.get("price")) : null;
            } 
            
            // 2. It's a Stock - Fetch from Yahoo Finance (NSE)
            String yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol.toUpperCase() + ".NS?interval=1m&range=1d";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(yahooUrl, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                List<Map<String, Object>> result = (List<Map<String, Object>>) chart.get("result");
                if (result != null && !result.isEmpty()) {
                    Map<String, Object> meta = (Map<String, Object>) result.get(0).get("meta");
                    Object priceObj = meta.get("regularMarketPrice");
                    if (priceObj instanceof Number) {
                        return ((Number) priceObj).doubleValue();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch market price for " + symbol + ": " + e.getMessage());
        }
        return null;
    }

    private boolean isCrypto(String symbol) {
        return List.of("BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "DOT", "ADA").contains(symbol.toUpperCase());
    }
}
