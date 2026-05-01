package com.trading.engine.model;

import java.math.BigDecimal;
import java.util.UUID;

public class Order {

    private String orderId;
    private String type;
    private String orderType;
    private String timeInForce;
  
    private BigDecimal price;
    private BigDecimal stopPrice; // 🔥 NEW: For Stop-Loss/Take-Profit
    private int quantity;
    private int originalQuantity; // 🔥 ADDED
    private long timestamp;
    private String status;
    private String symbol;
    private String currency;
    private String username;

    public Order() {
        this.orderId = UUID.randomUUID().toString();
        this.timestamp = System.currentTimeMillis();
        this.orderType = "LIMIT";
        this.timeInForce = "GTC";
        this.status = "NEW";
    }

    public Order(String type, BigDecimal price, int quantity, String symbol, String currency) {
        this.orderId = UUID.randomUUID().toString();
        this.type = type;
        this.price = price;
        this.quantity = quantity;
        this.originalQuantity = quantity;
        this.timestamp = System.currentTimeMillis();
        this.orderType = "LIMIT";
        this.timeInForce = "GTC";
        this.status = "NEW";
        this.symbol = symbol;
        this.currency = currency; // ✅ ADD THIS
    }

    // Getters
    public String getOrderId() { return orderId; }
    public String getType() { return type; }
    public String getOrderType() { return orderType; }
    public String getTimeInForce() { return timeInForce; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getStopPrice() { return stopPrice; } // 🔥 NEW
    public int getQuantity() { return quantity; }
    public int getOriginalQuantity() { return originalQuantity; } // 🔥 ADDED
    public long getTimestamp() { return timestamp; }
    public String getStatus() { return status; }
    public String getSymbol() { return symbol; }
    public String getCurrency() { return currency; }
    public String getUsername() { return username; }

    // Setters
    public void setQuantity(int quantity) { 
        this.quantity = quantity; 
        if (this.originalQuantity == 0) {
            this.originalQuantity = quantity;
        }
    }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setStopPrice(BigDecimal stopPrice) { this.stopPrice = stopPrice; } // 🔥 NEW
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public void setTimeInForce(String timeInForce) { this.timeInForce = timeInForce; }
    public void setStatus(String status) { this.status = status; }
    public void setType(String type) { this.type = type; }
    public void setOriginalQuantity(int originalQuantity) {
        this.originalQuantity = originalQuantity;
    }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setUsername(String username) { this.username = username; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    
    @Override
    public String toString() {
        return "Order{" +
                "orderId='" + orderId + '\'' +
                ", type='" + type + '\'' +
                ", orderType='" + orderType + '\'' +
                ", tif='" + timeInForce + '\'' +
                ", price=" + price +
                ", quantity=" + quantity +
                ", symbol='" + symbol + '\'' +
                ", status='" + status + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order)) return false;
        Order order = (Order) o;
        return orderId.equals(order.orderId);
    }

    @Override
    public int hashCode() {
        return orderId.hashCode();
    }
}