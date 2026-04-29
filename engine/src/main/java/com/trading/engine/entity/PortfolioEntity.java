package com.trading.engine.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "portfolio")
public class PortfolioEntity {

    @Id
    private String id;

    private String username;
    private String asset; // BTC, ETH

    private BigDecimal quantity;
    private BigDecimal avgPrice;

    // ===== GETTERS =====
    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getAsset() { return asset; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getAvgPrice() { return avgPrice; }

    // ===== SETTERS =====
    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setAsset(String asset) { this.asset = asset; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setAvgPrice(BigDecimal avgPrice) { this.avgPrice = avgPrice; }
}