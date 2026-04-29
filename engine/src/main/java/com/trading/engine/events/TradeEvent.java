package com.trading.engine.events;

import com.trading.engine.model.Trade;
import java.util.List;

public class TradeEvent {

    private String symbol;
    private String currency;
    private List<Trade> trades;

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public List<Trade> getTrades() { return trades; }
    public void setTrades(List<Trade> trades) { this.trades = trades; }
}