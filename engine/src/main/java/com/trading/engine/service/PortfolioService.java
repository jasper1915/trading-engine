package com.trading.engine.service;

import com.trading.engine.entity.PortfolioEntity;
import com.trading.engine.repository.PortfolioRepository;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class PortfolioService {

    @Autowired
    private PortfolioRepository repo;

    // ✅ Update after BUY
    public void updateAfterBuy(String username, String asset, BigDecimal qty, BigDecimal price) {

        PortfolioEntity p = repo.findByUsernameAndAsset(username, asset)
                .orElseGet(() -> {
                    PortfolioEntity newP = new PortfolioEntity();
                    newP.setId(UUID.randomUUID().toString());
                    newP.setUsername(username);
                    newP.setAsset(asset);
                    newP.setQuantity(BigDecimal.ZERO);
                    newP.setAvgPrice(BigDecimal.ZERO);
                    return newP;
                });

        BigDecimal totalCost = (p.getAvgPrice().multiply(p.getQuantity())).add(price.multiply(qty));
        BigDecimal newQty = p.getQuantity().add(qty);

        p.setQuantity(newQty);
        p.setAvgPrice(totalCost.divide(newQty, RoundingMode.HALF_UP));

        repo.save(p);
    }

    // ✅ Update after SELL
    public void updateAfterSell(String username, String asset, BigDecimal qty) {

        PortfolioEntity p = repo.findByUsernameAndAsset(username, asset)
                .orElseGet(() -> {
                    PortfolioEntity newP = new PortfolioEntity();
                    newP.setId(UUID.randomUUID().toString());
                    newP.setUsername(username);
                    newP.setAsset(asset);
                    newP.setQuantity(BigDecimal.ZERO); // We allow it to start at 0 if gifted
                    newP.setAvgPrice(BigDecimal.ZERO);
                    return newP;
                });

        BigDecimal newQty = p.getQuantity().subtract(qty);

        // Note: WalletService already checked total balance, so we just track quantity here
        p.setQuantity(newQty);
        repo.save(p);
    }

    @Autowired
    private WalletService walletService;

    // ✅ Get full portfolio (Synced with Wallet)
    public List<PortfolioEntity> getPortfolio(String username) {
        List<PortfolioEntity> holdings = repo.findByUsername(username);
        
        // 🔄 Sync all major assets from wallet
        String[] syncAssets = {"BTC", "ETH", "SOL", "RELIANCE", "TCS", "ZOMATO", "HDFCBANK", "TATAMOTORS", "SUZLON", "ICICIBANK"};
        
        for (String asset : syncAssets) {
            BigDecimal actualBalance = walletService.getBalance(username, asset);
            
            PortfolioEntity holding = holdings.stream()
                    .filter(p -> p.getAsset().equalsIgnoreCase(asset))
                    .findFirst()
                    .orElse(null);

            if (holding == null && actualBalance.compareTo(BigDecimal.ZERO) > 0) {
                PortfolioEntity newP = new PortfolioEntity();
                newP.setId(UUID.randomUUID().toString());
                newP.setUsername(username);
                newP.setAsset(asset);
                newP.setQuantity(actualBalance);
                newP.setAvgPrice(BigDecimal.ZERO); 
                repo.save(newP);
                holdings.add(newP);
            } else if (holding != null && holding.getQuantity().compareTo(actualBalance) != 0) {
                holding.setQuantity(actualBalance);
                repo.save(holding);
            }
        }

        return holdings;
    }

    // ✅ PnL
    public BigDecimal calculatePnL(String username, String asset, BigDecimal currentPrice) {

        PortfolioEntity p = repo.findByUsernameAndAsset(username, asset)
                .orElseThrow();

        return (currentPrice.subtract(p.getAvgPrice())).multiply(p.getQuantity());
    }
}