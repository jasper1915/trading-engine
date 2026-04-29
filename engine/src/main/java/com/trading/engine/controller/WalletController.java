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

    // ✅ Claim 1,000 Test Coins for all 7 assets
    @PostMapping("/claim-test-coins")
    public String claimTestCoins(Principal principal) {
        String username = principal.getName();
        String[] assets = {"BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "DOT"};
        for (String asset : assets) {
            walletService.deposit(username, new BigDecimal("1000"), asset);
        }
        return "Claimed 1,000 units of each asset successfully!";
    }
}