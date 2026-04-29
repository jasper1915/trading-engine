package com.trading.engine.engine;

import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.locks.ReentrantLock;

@Component
public class MatchingEngine {

    // 🔥 Multi-asset orderbooks
    private Map<String, PriorityQueue<Order>> buyOrderBooks = new HashMap<>();
    private Map<String, PriorityQueue<Order>> sellOrderBooks = new HashMap<>();

    private List<Trade> trades = new CopyOnWriteArrayList<>();
    private Map<String, Order> orderMap = new ConcurrentHashMap<>();
    private List<Order> stopOrders = new CopyOnWriteArrayList<>(); // 🔥 NEW: Vault for SL/TP orders
    private final ReentrantLock lock = new ReentrantLock();
    private BigDecimal lastPrice = BigDecimal.ZERO; // Track market price

    // 🔥 Key = BTC_USD, ETH_INR etc.
    private String getKey(Order order) {
        return order.getSymbol() + "_" + order.getCurrency();
    }
    

    // 🔥 BUY BOOK (max heap)
    private PriorityQueue<Order> getBuyBook(String key) {
        return buyOrderBooks.computeIfAbsent(key, k ->
                new PriorityQueue<>((o1, o2) -> {
                   if (o1.getPrice().compareTo(o2.getPrice()) != 0)
                        return o2.getPrice().compareTo(o1.getPrice());
                   return Long.compare(o1.getTimestamp(), o2.getTimestamp());
                })
        );
    }

    // 🔥 SELL BOOK (min heap)
    private PriorityQueue<Order> getSellBook(String key) {
        return sellOrderBooks.computeIfAbsent(key, k ->
                new PriorityQueue<>((o1, o2) -> {
                    if (o1.getPrice().compareTo(o2.getPrice()) != 0)
                        return o1.getPrice().compareTo(o2.getPrice());
                    return Long.compare(o1.getTimestamp(), o2.getTimestamp());
                })
        );
    }
    public List<Trade> getLatestTrades(int fromIndex) {
        return trades.subList(fromIndex, trades.size());
    }

    // 🚀 MAIN ENTRY
    public void processOrder(Order order) {

        lock.lock();
        try {
            order.setOriginalQuantity(order.getQuantity());
            orderMap.put(order.getOrderId(), order);

            String key = getKey(order);

            // 🔥 CHECK FOR STOP ORDER
            if (order.getStopPrice() != null && order.getStopPrice().compareTo(BigDecimal.ZERO) > 0) {
                System.out.println("DEBUG: [MatchingEngine] Holding Stop Order. Trigger: $" + order.getStopPrice());
                order.setStatus("STOP_PENDING");
                stopOrders.add(order);
                return;
            }

            PriorityQueue<Order> buyOrders = getBuyBook(key);
            PriorityQueue<Order> sellOrders = getSellBook(key);

            if (order.getType().equalsIgnoreCase("BUY")) {
                matchBuy(order, buyOrders, sellOrders);
            } else {
                matchSell(order, buyOrders, sellOrders);
            }

            if (order.getQuantity() == 0) {
                order.setStatus("FILLED");
            }

        } finally {
            lock.unlock();
        }
    }

    // 🔥 BUY MATCHING
    private void matchBuy(Order order,
                          PriorityQueue<Order> buyOrders,
                          PriorityQueue<Order> sellOrders) {

        Order buyOrder = order;
        boolean isMarket = "MARKET".equalsIgnoreCase(buyOrder.getOrderType());

        while (!sellOrders.isEmpty()) {
            Order bestSell = sellOrders.peek();
            
            // For Limit orders, check price. For Market orders, always match.
            if (!isMarket && buyOrder.getPrice().compareTo(bestSell.getPrice()) < 0) {
                break;
            }

            Order sellOrder = sellOrders.poll();
            int tradeQty = Math.min(buyOrder.getQuantity(), sellOrder.getQuantity());

            Trade trade = new Trade(
                    buyOrder.getSymbol(),
                    buyOrder.getOrderId(),
                    sellOrder.getOrderId(),
                    buyOrder.getUsername(),
                    sellOrder.getUsername(),
                    sellOrder.getPrice(), // Trade happens at the existing order's price
                    tradeQty
            );
            trades.add(trade);
            lastPrice = trade.getPrice();
            checkStopTriggers(getKey(buyOrder));

            buyOrder.setQuantity(buyOrder.getQuantity() - tradeQty);
            sellOrder.setQuantity(sellOrder.getQuantity() - tradeQty);

            buyOrder.setStatus(buyOrder.getQuantity() == 0 ? "FILLED" : "PARTIAL");
            sellOrder.setStatus(sellOrder.getQuantity() == 0 ? "FILLED" : "PARTIAL");

            if (sellOrder.getQuantity() > 0) {
                sellOrders.add(sellOrder);
            }

            if (buyOrder.getQuantity() == 0) break;
        }

        if (buyOrder.getQuantity() > 0 && !isMarket) {
            buyOrders.add(buyOrder);
        } else if (buyOrder.getQuantity() > 0 && isMarket) {
            // Market orders that couldn't be fully filled are effectively cancelled (IOC behavior)
            buyOrder.setStatus("FILLED"); // Mark as filled so it doesn't stay open
            System.out.println("DEBUG: [MatchingEngine] Market Buy partially filled. Remaining " + buyOrder.getQuantity() + " cancelled.");
            buyOrder.setQuantity(0); 
        }
    }

    // 🔥 SELL MATCHING
    private void matchSell(Order order,
                           PriorityQueue<Order> buyOrders,
                           PriorityQueue<Order> sellOrders) {

        Order sellOrder = order;
        boolean isMarket = "MARKET".equalsIgnoreCase(sellOrder.getOrderType());

        while (!buyOrders.isEmpty()) {
            Order bestBuy = buyOrders.peek();

            // For Limit orders, check price. For Market orders, always match.
            if (!isMarket && sellOrder.getPrice().compareTo(bestBuy.getPrice()) > 0) {
                break;
            }

            Order buyOrder = buyOrders.poll();
            int tradeQty = Math.min(sellOrder.getQuantity(), buyOrder.getQuantity());

            Trade trade = new Trade(
                    sellOrder.getSymbol(),
                    buyOrder.getOrderId(),
                    sellOrder.getOrderId(),
                    buyOrder.getUsername(),
                    sellOrder.getUsername(),
                    buyOrder.getPrice(), // Trade happens at the existing order's price
                    tradeQty
            );
            trades.add(trade);
            lastPrice = trade.getPrice();
            checkStopTriggers(getKey(sellOrder));

            sellOrder.setQuantity(sellOrder.getQuantity() - tradeQty);
            buyOrder.setQuantity(buyOrder.getQuantity() - tradeQty);

            sellOrder.setStatus(sellOrder.getQuantity() == 0 ? "FILLED" : "PARTIAL");
            buyOrder.setStatus(buyOrder.getQuantity() == 0 ? "FILLED" : "PARTIAL");

            if (buyOrder.getQuantity() > 0) {
                buyOrders.add(buyOrder);
            }

            if (sellOrder.getQuantity() == 0) break;
        }

        if (sellOrder.getQuantity() > 0 && !isMarket) {
            sellOrders.add(sellOrder);
        } else if (sellOrder.getQuantity() > 0 && isMarket) {
            // Market orders that couldn't be fully filled are effectively cancelled (IOC behavior)
            sellOrder.setStatus("FILLED");
            System.out.println("DEBUG: [MatchingEngine] Market Sell partially filled. Remaining " + sellOrder.getQuantity() + " cancelled.");
            sellOrder.setQuantity(0);
        }
    }

    // ❌ CANCEL ORDER
    public boolean cancelOrder(String orderId) {

        lock.lock();
        try {
            Order order = orderMap.get(orderId);
            if (order == null) return false;

            String key = getKey(order);

            PriorityQueue<Order> buyOrders = buyOrderBooks.get(key);
            PriorityQueue<Order> sellOrders = sellOrderBooks.get(key);

            if (order.getType().equalsIgnoreCase("BUY")) {
                if (buyOrders != null) buyOrders.remove(order);
            } else {
                if (sellOrders != null) sellOrders.remove(order);
            }

            order.setStatus("CANCELLED");
            return true;

        } finally {
            lock.unlock();
        }
    }

    // 📊 GET DATA
    public List<Order> getBuyOrders() {
        List<Order> all = new ArrayList<>();
        for (PriorityQueue<Order> q : buyOrderBooks.values()) {
            all.addAll(q);
        }
        return all;
    }

    public List<Order> getSellOrders() {
        List<Order> all = new ArrayList<>();
        for (PriorityQueue<Order> q : sellOrderBooks.values()) {
            all.addAll(q);
        }
        return all;
    }

    public List<Trade> getTrades() {
        return trades;
    }

    public List<Order> getAllOrders() {
        return new ArrayList<>(orderMap.values());
    }

    public Order getOrderById(String orderId) {
        Order order = orderMap.get(orderId);

        if (order == null) {
            throw new RuntimeException("Order not found: " + orderId);
        }

        return order;
    }
    

    public Map<String, Map<String, Integer>> getOrderBookBySymbol(String symbol, String currency){

        String key = symbol + "_" + currency;

        PriorityQueue<Order> buyOrders =
                buyOrderBooks.getOrDefault(key, new PriorityQueue<>());

        PriorityQueue<Order> sellOrders =
                sellOrderBooks.getOrDefault(key, new PriorityQueue<>());

        // ✅ USE STRING KEYS (IMPORTANT)
        Map<String, Integer> buyDepth = new TreeMap<>(Collections.reverseOrder());
        Map<String, Integer> sellDepth = new TreeMap<>();

        // 🔥 Aggregate BUY
        for (Order order : buyOrders) {
            String price = String.valueOf(order.getPrice());

            buyDepth.put(
                price,
                buyDepth.getOrDefault(price, 0) + order.getQuantity()
            );
        }

        // 🔥 Aggregate SELL
        for (Order order : sellOrders) {
            String price = String.valueOf(order.getPrice());

            sellDepth.put(
                price,
                sellDepth.getOrDefault(price, 0) + order.getQuantity()
            );
        }
         
        Map<String, Map<String, Integer>> result = new HashMap<>();
        result.put("bids", buyDepth);
        result.put("asks", sellDepth);

        return result;
    }

    private void checkStopTriggers(String key) {
        List<Order> triggered = new ArrayList<>();
        for (Order o : stopOrders) {
            if (!(o.getSymbol() + "_" + o.getCurrency()).equals(key)) continue;
            boolean isSellStop = "SELL".equalsIgnoreCase(o.getType());
            if (isSellStop && lastPrice.compareTo(o.getStopPrice()) <= 0) {
                triggered.add(o);
            } else if (!isSellStop && lastPrice.compareTo(o.getStopPrice()) >= 0) {
                triggered.add(o);
            }
        }
        for (Order o : triggered) {
            stopOrders.remove(o);
            o.setStatus("NEW");
            o.setStopPrice(null); 
            processOrder(o);
        }
    }
}