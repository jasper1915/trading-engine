package com.trading.engine.controller;

import com.trading.engine.entity.PortfolioEntity;
import com.trading.engine.service.PortfolioService;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    private final PortfolioService service;

    public PortfolioController(PortfolioService service) {
        this.service = service;
    }

    private String getUser() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    // ✅ Get portfolio
    @GetMapping
    public List<PortfolioEntity> getPortfolio() {
        return service.getPortfolio(getUser());
    }

    // ✅ Get PnL
    @GetMapping("/pnl")
    public BigDecimal getPnL(@RequestParam String asset,
                         @RequestParam BigDecimal price) {

        return service.calculatePnL(getUser(), asset, price);
    }
}