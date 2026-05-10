package com.trading.engine.controller;

import com.trading.engine.service.WalletService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    // ✅ Get Balance
    @GetMapping("/balance")
    public Map<String, BigDecimal> getBalance(@RequestParam String currency, Principal principal) {
        String username = principal.getName();
        BigDecimal available = walletService.getBalance(username, currency);
        BigDecimal locked = walletService.getLockedBalance(username, currency);
        
        return Map.of(
            "available", available,
            "locked", locked
        );
    }

    // ✅ Deposit
    @PostMapping("/deposit")
    public String deposit(@RequestParam BigDecimal amount,
                          @RequestParam String currency,
                          Principal principal) {
        String username = principal.getName();
        walletService.deposit(username, amount, currency);
        return "Deposited Successfully";
    }

    // ✅ Withdraw
    @PostMapping("/withdraw")
    public String withdraw(@RequestParam BigDecimal amount,
                           @RequestParam String currency,
                           Principal principal) {
        String username = principal.getName();
        walletService.lockFunds(username, amount, currency);
        return "Withdrawn Successfully";
    }

    // ✅ Claim 1,000 Test Units for all top assets
    @PostMapping("/claim-test-coins")
    public String claimTestCoins(@RequestParam(required = false) String symbol, Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        String username = principal.getName();
        System.out.println("🎁 [WalletController] Targeted credit request for: " + symbol + " (User: " + username + ")");

        try {
            // 1. Always credit cash (USD and INR)
            walletService.setGiftBalances(username, "USD");
            walletService.setGiftBalances(username, "INR");

            // 2. Only credit the specific asset if provided
            if (symbol != null && !symbol.isEmpty()) {
                // Ensure we don't double-credit if symbol is USD or INR
                if (!symbol.equalsIgnoreCase("USD") && !symbol.equalsIgnoreCase("INR")) {
                    walletService.setGiftBalances(username, symbol.toUpperCase());
                }
                return "Successfully credited $1,000,000 USD/INR and 1,000 " + symbol.toUpperCase() + "!";
            }
            
            return "Successfully credited $1,000,000 USD/INR!";
        } catch (Exception e) {
            System.err.println("❌ [WalletController] Targeted credit failed: " + e.getMessage());
            throw new RuntimeException("Failed to credit balance: " + e.getMessage());
        }
    }
}