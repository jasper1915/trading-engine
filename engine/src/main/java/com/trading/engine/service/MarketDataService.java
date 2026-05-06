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
            // 0. Check if it's a Base Currency
            if (symbol.equalsIgnoreCase("USD") || symbol.equalsIgnoreCase("INR")) {
                return 1.0;
            }
            
            // Special Case: Live USD/INR Rate
            if (symbol.equalsIgnoreCase("USDINR")) {
                String url = "https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1m&range=1d";
                return fetchFromYahoo(url);
            }

            // 1. Check if it's Crypto
            if (isCrypto(symbol)) {
                String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol.toUpperCase() + "USDT";
                Map<String, String> response = restTemplate.getForObject(url, Map.class);
                return response != null ? Double.parseDouble(response.get("price")) : null;
            } 
            
            // 2. It's a Stock - Fetch from Yahoo Finance (NSE)
            String yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol.toUpperCase() + ".NS?interval=1m&range=1d";
            return fetchFromYahoo(yahooUrl);

        } catch (Exception e) {
            System.err.println("Failed to fetch market price for " + symbol + ": " + e.getMessage());
        }
        return null;
    }

    private Double fetchFromYahoo(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            headers.set("Accept", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                List<Map<String, Object>> result = (List<Map<String, Object>>) chart.get("result");
                if (result != null && !result.isEmpty()) {
                    Map<String, Object> res0 = result.get(0);
                    Map<String, Object> meta = (Map<String, Object>) res0.get("meta");
                    
                    Object price = meta.get("regularMarketPrice");
                    if (price == null) {
                        Map<String, Object> indicators = (Map<String, Object>) res0.get("indicators");
                        List<Map<String, Object>> quote = (List<Map<String, Object>>) indicators.get("quote");
                        List<Double> close = (List<Double>) quote.get(0).get("close");
                        price = close.get(close.size() - 1);
                    }
                    
                    if (price instanceof Number) {
                        return ((Number) price).doubleValue();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Yahoo Fetch Error: " + e.getMessage());
        }
        return null;
    }

    private boolean isCrypto(String symbol) {
        return List.of("BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "DOT", "ADA").contains(symbol.toUpperCase());
    }
}
