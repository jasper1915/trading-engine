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

            // 1. Resolve Asset Type
            boolean isCryptoAsset = isCrypto(symbol);
            
            if (isCryptoAsset) {
                String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol.toUpperCase() + "USDT";
                Double price = fetchFromBinance(url);
                if (price != null) return price;
            } 
            
            // 2. Stock or Fallback - Fetch from Yahoo Finance (NSE)
            String yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol.toUpperCase() + ".NS?interval=1m&range=1d";
            Double stockPrice = fetchFromYahoo(yahooUrl);
            
            // 3. Final Fallback: If Yahoo fails for a crypto-looking symbol, try Binance anyway
            if (stockPrice == null && !isCryptoAsset && symbol.length() <= 5) {
                String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol.toUpperCase() + "USDT";
                return fetchFromBinance(url);
            }

            return stockPrice;

        } catch (Exception e) {
            System.err.println("Failed to fetch market price for " + symbol + ": " + e.getMessage());
        }
        return null;
    }

    private Double fetchFromYahoo(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
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
                        double stockPrice = ((Number) price).doubleValue();
                        System.out.println("✅ [MarketDataService] Yahoo Price for: " + stockPrice);
                        return stockPrice;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Yahoo Fetch Error: " + e.getMessage());
        }
        return null;
    }

    private Double fetchFromBinance(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();
            
            if (response != null && response.containsKey("price")) {
                double price = Double.parseDouble(response.get("price").toString());
                System.out.println("✅ [MarketDataService] Binance Price: " + price);
                return price;
            }
        } catch (Exception e) {
            System.err.println("Binance Fetch Error: " + e.getMessage());
        }
        return null;
    }

    private boolean isCrypto(String symbol) {
        return List.of("BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "DOT", "ADA", "MATIC", "TRX", "LTC", "AVAX").contains(symbol.toUpperCase());
    }
}
