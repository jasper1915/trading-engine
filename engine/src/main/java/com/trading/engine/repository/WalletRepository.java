package com.trading.engine.repository;

import com.trading.engine.entity.WalletEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<WalletEntity, String> {

    Optional<WalletEntity> findByUsernameAndCurrency(String username, String currency);
}