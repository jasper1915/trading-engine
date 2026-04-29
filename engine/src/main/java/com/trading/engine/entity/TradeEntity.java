package com.trading.engine.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "trades")
public class TradeEntity {

    @Id
    private String id;

    private String buyOrderId;
    private String sellOrderId;

    private String buyerUsername;
    private String sellerUsername;

    private BigDecimal price;
    private int quantity;

    private long timestamp;

    // getters
    public String getId() { return id; }
    public String getBuyOrderId() { return buyOrderId; }
    public String getSellOrderId() { return sellOrderId; }
    public String getBuyerUsername() { return buyerUsername; }
    public String getSellerUsername() { return sellerUsername; }
    public BigDecimal getPrice() { return price; }
    public int getQuantity() { return quantity; }
    public long getTimestamp() { return timestamp; }

    // setters
    public void setId(String id) { this.id = id; }
    public void setBuyOrderId(String buyOrderId) { this.buyOrderId = buyOrderId; }
    public void setSellOrderId(String sellOrderId) { this.sellOrderId = sellOrderId; }
    public void setBuyerUsername(String buyerUsername) { this.buyerUsername = buyerUsername; }
    public void setSellerUsername(String sellerUsername) { this.sellerUsername = sellerUsername; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}