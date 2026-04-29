package com.trading.engine.events;

import java.util.Map;

public class OrderBookEvent {

    private String symbol;
    private String currency;

    private Map<String, Integer> bids;
    private Map<String, Integer> asks;

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Map<String, Integer> getBids() { return bids; }
    public void setBids(Map<String, Integer> bids) { this.bids = bids; }

    public Map<String, Integer> getAsks() { return asks; }
    public void setAsks(Map<String, Integer> asks) { this.asks = asks; }
}