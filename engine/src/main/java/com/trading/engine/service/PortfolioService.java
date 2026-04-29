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
        
        // 🔄 Sync BTC specifically (or we could loop through all currencies)
        BigDecimal actualBtc = walletService.getBalance(username, "BTC");
        
        PortfolioEntity btcHolding = holdings.stream()
                .filter(p -> p.getAsset().equals("BTC"))
                .findFirst()
                .orElse(null);

        if (btcHolding == null && actualBtc.compareTo(BigDecimal.ZERO) > 0) {
            // Auto-create portfolio record for existing BTC
            btcHolding = new PortfolioEntity();
            btcHolding.setId(UUID.randomUUID().toString());
            btcHolding.setUsername(username);
            btcHolding.setAsset("BTC");
            btcHolding.setQuantity(actualBtc);
            btcHolding.setAvgPrice(BigDecimal.ZERO); // We don't know the cost of gifted BTC
            repo.save(btcHolding);
            holdings.add(btcHolding);
        } else if (btcHolding != null && btcHolding.getQuantity().compareTo(actualBtc) != 0) {
            // Update quantity to match wallet
            btcHolding.setQuantity(actualBtc);
            repo.save(btcHolding);
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