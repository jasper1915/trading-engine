package com.trading.engine.repository;

import com.trading.engine.entity.TradeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeRepository extends JpaRepository<TradeEntity, String> {
    List<TradeEntity> findByBuyerUsernameOrSellerUsernameOrderByTimestampDesc(String buyerUsername, String sellerUsername);
}
