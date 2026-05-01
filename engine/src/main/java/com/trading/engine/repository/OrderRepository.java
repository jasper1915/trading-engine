package com.trading.engine.repository;

import com.trading.engine.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findByStatusIn(List<String> statuses);
}