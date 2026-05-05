package com.trading.engine.service;

import com.trading.engine.entity.WalletEntity;
import com.trading.engine.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.UUID;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    private WalletEntity getOrCreateWallet(String username, String currency) {
        String finalUsername = username != null ? username.toLowerCase() : null;
        return walletRepository.findByUsernameAndCurrency(finalUsername, currency)
                .orElseGet(() -> {
                    WalletEntity newWallet = new WalletEntity();
                    newWallet.setId(UUID.randomUUID().toString());
                    newWallet.setUsername(finalUsername);
                    newWallet.setCurrency(currency);
                    
                    // 💰 Welcome Bonus: Gift 1,000,000 USD or 1,000 units of any stock/crypto
                    if ("USD".equalsIgnoreCase(currency)) {
                        newWallet.setBalance(new BigDecimal("1000000"));
                    } else {
                        // Give 1,000 units of any of our major assets by default
                        newWallet.setBalance(new BigDecimal("1000"));
                    }
                    
                    newWallet.setLocked(BigDecimal.ZERO);
                    return walletRepository.save(newWallet);
                });
    }

    // ✅ Deposit
    public void deposit(String username, BigDecimal amount, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    // ✅ Get balance
    public BigDecimal getBalance(String username, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        
        // 🎁 Welcome Bonus: Gift 1,000,000 USD or 100 BTC if balance is exactly 0
        if (wallet.getBalance().compareTo(BigDecimal.ZERO) == 0) {
            if ("USD".equalsIgnoreCase(currency)) {
                wallet.setBalance(new BigDecimal("1000000"));
                walletRepository.save(wallet);
            } else if ("BTC".equalsIgnoreCase(currency)) {
                wallet.setBalance(new BigDecimal("1000"));
                walletRepository.save(wallet);
            }
        }
        
        return wallet.getBalance();
    }

    // 🔒 Lock funds
    public void lockFunds(String username, BigDecimal amount, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setLocked(wallet.getLocked().add(amount));
        walletRepository.save(wallet);
    }

    // 🔥 Deduct locked
    public void deductLocked(String username, BigDecimal amount, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        wallet.setLocked(wallet.getLocked().subtract(amount));
        walletRepository.save(wallet);
    }

    // 🔄 Release unused
    public void releaseFunds(String username, BigDecimal amount, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        wallet.setLocked(wallet.getLocked().subtract(amount));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    // 💰 Credit
    public void credit(String username, BigDecimal amount, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
    }

    public BigDecimal getLockedBalance(String username, String currency) {
        return getOrCreateWallet(username, currency).getLocked();
    }
}