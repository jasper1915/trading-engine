package com.trading.engine.controller;

import com.trading.engine.service.MarketDataService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketDataService marketDataService;

    public MarketController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/price")
    public Map<String, Object> getPrice(@RequestParam String symbol) {
        Double price = marketDataService.getRealTimePrice(symbol);
        return Map.of(
            "symbol", symbol,
            "price", price != null ? price : 0.0,
            "source", price != null ? "live" : "fallback"
        );
    }
}
