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
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        String username = principal.getName();
        System.out.println("🎁 [WalletController] Reset request for user: " + username);

        // Core assets to ensure speed and stability
        String[] assets = {
            "RELIANCE", "TCS", "ZOMATO", "HDFCBANK", "TATAMOTORS", 
            "INFY", "ADANIENT", "BTC", "ETH", "SOL", "HINDUNILVR", 
            "BAJFINANCE", "ICICIBANK", "ITC", "SBIN", "BHARTIARTL", 
            "LICI", "KOTAKBANK", "LT", "HCLTECH", "AXISBANK", 
            "ASIANPAINT", "MARUTI", "SUNPHARMA", "TITAN", 
            "ULTRACEMCO", "WIPRO", "M&M", "JSWSTEEL", "POWERGRID", 
            "NTPC", "ONGC", "BNB", "XRP"
        };
        
        try {
            System.out.println("DEBUG: [WalletController] Setting $1,000,000 USD...");
            walletService.setGiftBalances(username, "USD");

            for (String asset : assets) {
                walletService.setGiftBalances(username, asset);
            }
            
            System.out.println("✅ [WalletController] Reset successful for " + username);
            return "Balances reset to $1,000,000 USD and 1,000 units of each asset successfully!";
        } catch (Exception e) {
            System.err.println("❌ [WalletController] Reset failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to reset balances: " + e.getMessage());
        }
    }
}