package com.trading.engine.controller;

import com.trading.engine.model.Order;
import com.trading.engine.model.Trade;
import com.trading.engine.service.OrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService service;

    // ✅ Constructor Injection (BEST PRACTICE)
    public OrderController(OrderService service) {
        this.service = service;
    }

    // ✅ Place Order
   @PostMapping
public Order placeOrder(@RequestBody Order order) {
    return service.createOrder(order);
}

    // ✅ Order Book
    @GetMapping("/orderbook")
    public Map<String, Object> getOrderBook() {
        return Map.of(
            "buyOrders", service.getBuyOrders(),
            "sellOrders", service.getSellOrders()
        );
    }
    

    // ✅ Trades
    @GetMapping("/trades")
    public List<Trade> getTrades() {
        return service.getTrades();
    }

    // ✅ My Trades
    @GetMapping("/my-trades")
    public List<com.trading.engine.entity.TradeEntity> getMyTrades() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return service.getUserTrades(username);
    }

    // ✅ My Active Orders (NEW)
    @GetMapping("/my-active")
    public List<Order> getMyActiveOrders() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return service.getUserActiveOrders(username);
    }

    // ✅ Cancel Order (NEW FEATURE)
    @DeleteMapping("/{id}")
public ResponseEntity<String> cancelOrder(@PathVariable String id) {

    boolean result = service.cancelOrder(id);

    if (result) {
        return ResponseEntity.ok("Cancelled");
    } else {
        return ResponseEntity.status(404).body("Order Not Found");
    }
}
    @GetMapping("/depth")
public Map<String, Map<String, Integer>> getDepth(
    @RequestParam String symbol,
    @RequestParam String currency
) {
    return service.getOrderBook(symbol, currency);
}
@GetMapping("/history")
public List<Order> getOrderHistory() {
    return service.getOrderHistory();
}

   
}