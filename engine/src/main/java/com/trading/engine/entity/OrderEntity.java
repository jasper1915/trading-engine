package com.trading.engine.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    private String id;

    private String symbol;
    private BigDecimal price;

    private int quantity;
    private int originalQuantity;

    private String type;
    private String status;

    private String orderType;
    private String timeInForce;

    private long timestamp;
    private String currency;
    private String username;

    // ===== GETTERS =====
    public String getId() { return id; }
    public String getSymbol() { return symbol; }
    public BigDecimal getPrice() { return price; }
    public int getQuantity() { return quantity; }
    public int getOriginalQuantity() { return originalQuantity; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getOrderType() { return orderType; }
    public String getTimeInForce() { return timeInForce; }
    public long getTimestamp() { return timestamp; }
    public String getCurrency() { return currency; }
    public String getUsername() { return username; }

    // ===== SETTERS =====
    public void setId(String id) { this.id = id; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public void setOriginalQuantity(int originalQuantity) { this.originalQuantity = originalQuantity; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public void setTimeInForce(String timeInForce) { this.timeInForce = timeInForce; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setUsername(String username) { this.username = username; }
}