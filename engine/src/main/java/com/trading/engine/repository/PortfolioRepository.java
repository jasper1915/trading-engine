package com.trading.engine.repository;

import com.trading.engine.entity.PortfolioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface PortfolioRepository extends JpaRepository<PortfolioEntity, String> {

    Optional<PortfolioEntity> findByUsernameAndAsset(String username, String asset);

    List<PortfolioEntity> findByUsername(String username);
}