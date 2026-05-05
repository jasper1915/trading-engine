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
    public String claimTestCoins(Principal principal) {
        String username = principal.getName();
        // Top Stocks + Top Crypto
        String[] assets = {
            "RELIANCE", "TCS", "ZOMATO", "HDFCBANK", "TATAMOTORS", 
            "INFY", "ADANIENT", "BTC", "ETH", "SOL"
        };
        
        // Basic check to see if they already have Reliance (meaning they likely already claimed)
        BigDecimal relianceBal = walletService.getBalance(username, "RELIANCE");
        if (relianceBal.compareTo(new BigDecimal("1000")) >= 0) {
            throw new RuntimeException("Gift already claimed! Check your portfolio.");
        }

        // Also give USD if they are broke
        BigDecimal usdBal = walletService.getBalance(username, "USD");
        if (usdBal.compareTo(BigDecimal.ZERO) == 0) {
            walletService.deposit(username, new BigDecimal("1000000"), "USD");
        }

        for (String asset : assets) {
            walletService.deposit(username, new BigDecimal("1000"), asset);
        }
        return "Claimed 1,000 units of each asset + $1,000,000 successfully!";
    }
}