package com.trading.engine.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
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
            // We append .NS for Indian stocks
            String yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol.toUpperCase() + ".NS?interval=1m&range=1d";
            Map<String, Object> response = restTemplate.getForObject(yahooUrl, Map.class);
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                List<Map<String, Object>> result = (List<Map<String, Object>>) chart.get("result");
                if (result != null && !result.isEmpty()) {
                    Map<String, Object> meta = (Map<String, Object>) result.get(0).get("meta");
                    return (Double) meta.get("regularMarketPrice");
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
