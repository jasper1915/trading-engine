package com.trading.engine.service;

import com.trading.engine.entity.WalletEntity;
import com.trading.engine.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.UUID;

@Service
@org.springframework.transaction.annotation.Transactional
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    private WalletEntity getOrCreateWallet(String username, String currency) {
        String finalUsername = username != null ? username.toLowerCase() : null;
        WalletEntity wallet = walletRepository.findByUsernameAndCurrency(finalUsername, currency)
                .orElseGet(() -> {
                    WalletEntity newWallet = new WalletEntity();
                    newWallet.setId(UUID.randomUUID().toString());
                    newWallet.setUsername(finalUsername);
                    newWallet.setCurrency(currency);
                    
                    // 💰 Welcome Bonus: Gift 1,000,000 if base currency, 1,000 if asset
                    if ("USD".equalsIgnoreCase(currency) || "INR".equalsIgnoreCase(currency)) {
                        newWallet.setBalance(new BigDecimal("1000000"));
                    } else {
                        newWallet.setBalance(BigDecimal.ZERO);
                    }
                    
                    newWallet.setLocked(BigDecimal.ZERO);
                    return walletRepository.save(newWallet);
                });
        
        if (wallet.getBalance() == null) wallet.setBalance(BigDecimal.ZERO);
        if (wallet.getLocked() == null) wallet.setLocked(BigDecimal.ZERO);
        return wallet;
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
        return wallet.getBalance();
    }

    public BigDecimal getLockedBalance(String username, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        BigDecimal locked = wallet.getLocked();
        if (locked.compareTo(BigDecimal.ZERO) < 0) {
            wallet.setLocked(BigDecimal.ZERO);
            walletRepository.save(wallet);
            return BigDecimal.ZERO;
        }
        return locked;
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


    // 🎁 RESET BALANCES
    public void setGiftBalances(String username, String currency) {
        WalletEntity wallet = getOrCreateWallet(username, currency);
        if ("USD".equalsIgnoreCase(currency) || "INR".equalsIgnoreCase(currency)) {
            wallet.setBalance(wallet.getBalance().add(new BigDecimal("1000000")));
        } else {
            wallet.setBalance(wallet.getBalance().add(new BigDecimal("1000")));
        }
        walletRepository.save(wallet);
    }
}