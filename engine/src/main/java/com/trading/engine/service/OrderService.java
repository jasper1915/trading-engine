package com.trading.engine.service;

import com.trading.engine.engine.MatchingEngine;
import com.trading.engine.events.EventPublisher;
import com.trading.engine.events.OrderBookEvent;
import com.trading.engine.events.TradeEvent;
import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.entity.OrderEntity;
import com.trading.engine.entity.TradeEntity;
import com.trading.engine.repository.OrderRepository;
import com.trading.engine.repository.TradeRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final MatchingEngine engine;
    private final WalletService walletService;
    private final OrderRepository orderRepository;
    private final TradeRepository tradeRepository;
    private final EventPublisher eventPublisher;
    private final PortfolioService portfolioService;

    public OrderService(MatchingEngine engine,
            WalletService walletService,
            OrderRepository orderRepository,
            TradeRepository tradeRepository,
            EventPublisher eventPublisher,
            PortfolioService portfolioService) {
        this.engine = engine;
        this.walletService = walletService;
        this.orderRepository = orderRepository;
        this.tradeRepository = tradeRepository;
        this.eventPublisher = eventPublisher;
        this.portfolioService = portfolioService;
    }

    @PostConstruct
    public void init() {
        System.out.println("🚀 [OrderService] Loading active orders from database...");
        List<OrderEntity> activeOrders = orderRepository.findByStatusIn(List.of("NEW", "PARTIAL", "STOP_PENDING"));
        int count = 0;
        for (OrderEntity entity : activeOrders) {
            Order order = new Order();
            order.setOrderId(entity.getId());
            order.setSymbol(entity.getSymbol());
            order.setPrice(entity.getPrice());
            order.setQuantity(entity.getQuantity());
            order.setOriginalQuantity(entity.getOriginalQuantity());
            order.setType(entity.getType());
            order.setStatus(entity.getStatus());
            order.setOrderType(entity.getOrderType());
            order.setTimeInForce(entity.getTimeInForce());
            order.setTimestamp(entity.getTimestamp());
            order.setCurrency(entity.getCurrency());
            order.setUsername(entity.getUsername());

            // Re-process without triggering new wallet locks or duplicate trades
            engine.restoreOrder(order);
            count++;
        }
        System.out.println("✅ [OrderService] Restored " + count + " orders to the matching engine.");
    }

    // ===========================
    // 🚀 CREATE ORDER
    // ===========================
    @Transactional
    public Order createOrder(Order order) {
        String username = getLoggedInUser();
        System.out.println("DEBUG: [OrderService] Creating " + order.getType() + " order for user: " + username);
        order.setUsername(username);

        // 1. Validate
        System.out.println("DEBUG: [OrderService] Validating order...");
        validate(order);

        BigDecimal priceToLock = order.getPrice();

        // ===========================
        // 🔥 WALLET LOCKING
        // ===========================
        if ("BUY".equalsIgnoreCase(order.getType())) {
            // If MARKET order, we need to estimate the price based on the best ASK
            if ("MARKET".equalsIgnoreCase(order.getOrderType())) {
                Map<String, Map<String, Integer>> book = engine.getOrderBookBySymbol(order.getSymbol(),
                        order.getCurrency());
                Map<String, Integer> asks = book.get("asks");
                if (asks == null || asks.isEmpty()) {
                    throw new RuntimeException("Cannot place Market Buy: No sellers available");
                }
                // Get the lowest ask price
                String bestAsk = asks.keySet().iterator().next();
                priceToLock = new BigDecimal(bestAsk);
            }

            BigDecimal totalCost = priceToLock.multiply(BigDecimal.valueOf(order.getQuantity()));
            System.out.println("DEBUG: [OrderService] Locking funds for BUY: " + totalCost + " " + order.getCurrency());
            BigDecimal balance = walletService.getBalance(username, order.getCurrency());

            if (balance.compareTo(totalCost) < 0) {
                System.out.println(
                        "DEBUG: [OrderService] Insufficient balance! Has: " + balance + ", Needs: " + totalCost);
                throw new RuntimeException(
                        "Insufficient balance. You need $" + totalCost + " but only have $" + balance);
            }
            walletService.lockFunds(username, totalCost, order.getCurrency());
        }

        if ("SELL".equalsIgnoreCase(order.getType())) {
            BigDecimal quantity = BigDecimal.valueOf(order.getQuantity());
            System.out.println("DEBUG: [OrderService] Locking asset for SELL: " + quantity + " " + order.getSymbol());
            walletService.lockFunds(username, quantity, order.getSymbol());
        }

        int beforeSize = engine.getTrades().size();

        // 2. Process order
        System.out.println("DEBUG: [OrderService] Sending order to Matching Engine...");
        engine.processOrder(order);

        // 3. Get new trades
        List<Trade> newTrades = engine.getLatestTrades(beforeSize);

        // ===========================
        // 🔥 TRADE SETTLEMENT
        // ===========================
        for (Trade trade : newTrades) {
            BigDecimal cost = trade.getPrice().multiply(BigDecimal.valueOf(trade.getQuantity()));
            Order buyOrder = engine.getOrderById(trade.getBuyOrderId());
            Order sellOrder = engine.getOrderById(trade.getSellOrderId());

            String buyer = buyOrder.getUsername();
            String seller = sellOrder.getUsername();

            walletService.deductLocked(buyer, cost, buyOrder.getCurrency());
            walletService.credit(buyer, BigDecimal.valueOf(trade.getQuantity()), buyOrder.getSymbol());

            portfolioService.updateAfterBuy(buyer, buyOrder.getSymbol(), BigDecimal.valueOf(trade.getQuantity()),
                    trade.getPrice());

            walletService.credit(seller, cost, sellOrder.getCurrency());
            walletService.deductLocked(seller, BigDecimal.valueOf(trade.getQuantity()), sellOrder.getSymbol());

            portfolioService.updateAfterSell(seller, sellOrder.getSymbol(), BigDecimal.valueOf(trade.getQuantity()));
        }

        // ===========================
        // 💾 SAVE ORDER & TRADES
        // ===========================
        saveOrderToDb(order); // Taker
        for (Trade trade : newTrades) {
            saveOrderToDb(engine.getOrderById(trade.getBuyOrderId())); // Maker/Taker Buy
            saveOrderToDb(engine.getOrderById(trade.getSellOrderId())); // Maker/Taker Sell
            saveTradeToDb(trade);
        }

        // ===========================
        // 📊 EVENT PUBLISHING (SAFE)
        // ===========================
        try {
            Map<String, Map<String, Integer>> orderBook = engine.getOrderBookBySymbol(order.getSymbol(),
                    order.getCurrency());
            OrderBookEvent obEvent = new OrderBookEvent();
            obEvent.setSymbol(order.getSymbol());
            obEvent.setCurrency(order.getCurrency());
            obEvent.setBids(orderBook.getOrDefault("bids", new HashMap<>()));
            obEvent.setAsks(orderBook.getOrDefault("asks", new HashMap<>()));
            eventPublisher.publishOrderBook(obEvent);

            if (!newTrades.isEmpty()) {
                TradeEvent tradeEvent = new TradeEvent();
                tradeEvent.setSymbol(order.getSymbol());
                tradeEvent.setCurrency(order.getCurrency());
                tradeEvent.setTrades(newTrades);
                eventPublisher.publishTrades(tradeEvent);
            }
        } catch (Exception e) {
            System.err.println("WARN: Event publish failed: " + e.getMessage());
        }

        // ===========================
        // 🔄 UNUSED FUND RELEASE (Price Improvement Refund)
        // ===========================
        if ("BUY".equalsIgnoreCase(order.getType())) {
            // How much we locked originally vs how much we actually spent
            BigDecimal totalLockedForFilledQty = priceToLock.multiply(BigDecimal.valueOf(order.getOriginalQuantity() - order.getQuantity()));
            BigDecimal totalSpent = BigDecimal.ZERO;
            for (Trade trade : newTrades) {
                totalSpent = totalSpent.add(trade.getPrice().multiply(BigDecimal.valueOf(trade.getQuantity())));
            }
            
            // If we spent less than what we locked for the executed portion, refund the difference
            BigDecimal refund = totalLockedForFilledQty.subtract(totalSpent);
            
            // Also, if the order is fully FILLED or CANCELLED, release everything else
            if ("FILLED".equalsIgnoreCase(order.getStatus()) || "CANCELLED".equalsIgnoreCase(order.getStatus())) {
                BigDecimal remainingLock = priceToLock.multiply(BigDecimal.valueOf(order.getQuantity()));
                refund = refund.add(remainingLock);
            }

            if (refund.compareTo(BigDecimal.ZERO) > 0) {
                System.out.println("DEBUG: [OrderService] Refunding unused funds (Price Improvement): " + refund);
                walletService.releaseFunds(username, refund, order.getCurrency());
            }
        }

        return order;
    }

    public List<Order> getBuyOrders() {
        return engine.getBuyOrders();
    }

    public List<Order> getSellOrders() {
        return engine.getSellOrders();
    }

    public List<Trade> getTrades() {
        return engine.getTrades();
    }

    public Map<String, Map<String, Integer>> getOrderBook(String symbol, String currency) {
        return engine.getOrderBookBySymbol(symbol, currency);
    }

    public List<Order> getOrderHistory() {
        return engine.getAllOrders();
    }

    public List<TradeEntity> getUserTrades(String username) {
        return tradeRepository.findByBuyerUsernameOrSellerUsernameOrderByTimestampDesc(username, username);
    }

    public List<Order> getUserActiveOrders(String username) {
        List<Order> active = new ArrayList<>();
        // Filter buy orders
        for (Order o : engine.getBuyOrders()) {
            if (o.getUsername().equals(username))
                active.add(o);
        }
        // Filter sell orders
        for (Order o : engine.getSellOrders()) {
            if (o.getUsername().equals(username))
                active.add(o);
        }
        return active;
    }

    private void saveOrderToDb(Order order) {
        OrderEntity entity = new OrderEntity();
        entity.setId(order.getOrderId());
        entity.setSymbol(order.getSymbol());
        entity.setPrice(order.getPrice());
        entity.setQuantity(order.getQuantity());
        entity.setOriginalQuantity(order.getOriginalQuantity());
        entity.setType(order.getType());
        entity.setStatus(order.getStatus());
        entity.setOrderType(order.getOrderType());
        entity.setTimeInForce(order.getTimeInForce());
        entity.setTimestamp(order.getTimestamp());
        entity.setCurrency(order.getCurrency());
        entity.setUsername(order.getUsername());
        orderRepository.save(entity);
    }

    private void saveTradeToDb(Trade trade) {
        TradeEntity tradeEntity = new TradeEntity();
        tradeEntity.setId(trade.getId());
        tradeEntity.setSymbol(trade.getSymbol());
        tradeEntity.setBuyOrderId(trade.getBuyOrderId());
        tradeEntity.setSellOrderId(trade.getSellOrderId());
        tradeEntity.setBuyerUsername(trade.getBuyerUsername());
        tradeEntity.setSellerUsername(trade.getSellerUsername());
        tradeEntity.setPrice(trade.getPrice());
        tradeEntity.setQuantity(trade.getQuantity());
        tradeEntity.setTimestamp(trade.getTimestamp());
        tradeRepository.save(tradeEntity);
    }

    public boolean cancelOrder(String id) {
        Order order = engine.getOrderById(id);
        String username = order.getUsername();
        boolean result = engine.cancelOrder(id);
        if (!result)
            return false;

        // 💾 UPDATE DB
        saveOrderToDb(order);

        if ("BUY".equalsIgnoreCase(order.getType())) {
            BigDecimal remaining = order.getPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
            walletService.releaseFunds(username, remaining, order.getCurrency());
        } else {
            walletService.releaseFunds(username, BigDecimal.valueOf(order.getQuantity()), order.getSymbol());
        }
        return true;
    }

    private void validate(Order order) {
        if ("LIMIT".equalsIgnoreCase(order.getOrderType()) && order.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid price for Limit Order");
        }
        if (order.getQuantity() <= 0)
            throw new RuntimeException("Invalid quantity");
    }

    private String getLoggedInUser() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}