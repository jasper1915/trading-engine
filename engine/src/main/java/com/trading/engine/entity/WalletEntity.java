package com.trading.engine.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wallet")
public class WalletEntity {

    @Id
    private String id;

    private String username;
    private String currency; // USD, BTC

    private BigDecimal balance;
    private BigDecimal locked;

    // ===== GETTERS =====
    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getCurrency() { return currency; }
    public BigDecimal getBalance() { return balance; }
    public BigDecimal getLocked() { return locked; }

    // ===== SETTERS =====
    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public void setLocked(BigDecimal locked) { this.locked = locked; }
}