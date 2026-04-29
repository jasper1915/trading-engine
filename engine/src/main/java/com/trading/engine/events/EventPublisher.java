package com.trading.engine.events;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public EventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishOrderBook(OrderBookEvent event) {
        messagingTemplate.convertAndSend(
            "/topic/orderbook/" + event.getSymbol() + "-" + event.getCurrency(),
            event
        );
    }

    public void publishTrades(TradeEvent event) {
        messagingTemplate.convertAndSend(
            "/topic/trades/" + event.getSymbol() + "-" + event.getCurrency(),
            event
        );
    }
}