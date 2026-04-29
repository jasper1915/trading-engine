package com.trading.engine.model;

import java.math.BigDecimal;

public class Trade {

    private String id;
    private String symbol; // 🔥 ADDED THIS
    private String buyOrderId;
    private String sellOrderId;
    private String buyerUsername;
    private String sellerUsername;
    private BigDecimal price;
    private int quantity;
    private long timestamp;

    public Trade(String symbol, String buyOrderId, String sellOrderId,
             String buyerUsername, String sellerUsername,
             BigDecimal price, int quantity) {
        this.id = java.util.UUID.randomUUID().toString();
        this.symbol = symbol; // 🔥 ADDED THIS
        this.buyOrderId = buyOrderId;
        this.sellOrderId = sellOrderId;
        this.buyerUsername = buyerUsername;
        this.sellerUsername = sellerUsername;
        this.price = price;
        this.quantity = quantity;
        this.timestamp = System.currentTimeMillis();
    }

    // 🔹 Getters
    public String getId() { return id; }
    public String getSymbol() { return symbol; } // 🔥 ADDED THIS
    public String getBuyOrderId() { return buyOrderId; }
    public String getSellOrderId() { return sellOrderId; }
    public String getBuyerUsername() { return buyerUsername; }
    public String getSellerUsername() { return sellerUsername; }
    public BigDecimal getPrice() { return price; }
    public int getQuantity() { return quantity; }
    public long getTimestamp() { return timestamp; }

    @Override
    public String toString() {
        return "Trade{" +
                "id='" + id + '\'' +
                ", symbol='" + symbol + '\'' +
                ", buyOrderId='" + buyOrderId + '\'' +
                ", sellOrderId='" + sellOrderId + '\'' +
                ", price=" + price +
                ", quantity=" + quantity +
                ", timestamp=" + timestamp +
                '}';
    }
}