package com.trading.engine.service;

import com.trading.engine.entity.UserEntity;
import com.trading.engine.model.LoginRequest;
import com.trading.engine.model.RegisterRequest;
import com.trading.engine.repository.UserRepository;
import com.trading.engine.security.JwtUtil;

import org.springframework.stereotype.Service;

import java.util.UUID;

import com.trading.engine.entity.WalletEntity;
import com.trading.engine.repository.WalletRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final WalletRepository walletRepository;
    private final OtpService otpService;

    // 🔐 password encoder
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepo,
                       JwtUtil jwtUtil,
                       WalletRepository walletRepository,
                       OtpService otpService) {

        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.walletRepository = walletRepository;
        this.otpService = otpService;
    }

    // ===========================
    public String register(RegisterRequest request) {

        if (request.getEmail() == null && request.getPhone() == null) {
            // ✅ FIXED LINE
            throw new RuntimeException("Email or Phone required");
        }

        // Check if OTP was provided to enforce verified registration
        String identifier = request.getEmail() != null ? request.getEmail() : request.getPhone();
        // For backwards compatibility we might bypass OTP if it's missing, but let's enforce it if we have a field for it
        // Actually, we'll just create a new method for it or let the frontend pass it.
        // Let's assume frontend passes a verified OTP. Wait, RegisterRequest doesn't have OTP.
        // I'll just add registerVerified method.

        if (request.getEmail() != null &&
                userRepo.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (request.getPhone() != null &&
                userRepo.findByPhone(request.getPhone()).isPresent()) {
            throw new RuntimeException("Phone already exists");
        }

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID().toString());
        String email = request.getEmail() != null ? request.getEmail().toLowerCase() : null;
        user.setEmail(email);
        user.setPhone(request.getPhone());
        user.setUsername(request.getUsername());
        user.setPanNumber(request.getPanNumber());

        // 🔐 encrypt password
        user.setPassword(encoder.encode(request.getPassword()));

        userRepo.save(user);

        // 💰 create initial USD wallet with 1,000,000 USD
        WalletEntity usdWallet = new WalletEntity();
        usdWallet.setId(UUID.randomUUID().toString());
        usdWallet.setUsername(
                email != null ? email : request.getPhone()
        );
        usdWallet.setCurrency("USD");
        usdWallet.setBalance(new java.math.BigDecimal("1000000"));
        usdWallet.setLocked(java.math.BigDecimal.ZERO);

        walletRepository.save(usdWallet);

        walletRepository.save(usdWallet);

        // 💰 create initial crypto/stock wallets with 1,000 units each
        String[] assets = {
            "RELIANCE", "TCS", "ZOMATO", "HDFCBANK", "TATAMOTORS", 
            "INFY", "ADANIENT", "BTC", "ETH", "SOL", "HINDUNILVR", 
            "BAJFINANCE", "ICICIBANK", "ITC", "SBIN", "BHARTIARTL", 
            "LICI", "KOTAKBANK", "LT", "HCLTECH", "AXISBANK", 
            "ASIANPAINT", "MARUTI", "SUNPHARMA", "TITAN", 
            "ULTRACEMCO", "WIPRO", "M&M", "JSWSTEEL", "POWERGRID", 
            "NTPC", "ONGC", "BNB", "XRP"
        };
        for (String asset : assets) {
            WalletEntity wallet = new WalletEntity();
            wallet.setId(UUID.randomUUID().toString());
            wallet.setUsername(email != null ? email : request.getPhone());
            wallet.setCurrency(asset);
            wallet.setBalance(new java.math.BigDecimal("1000"));
            wallet.setLocked(java.math.BigDecimal.ZERO);
            walletRepository.save(wallet);
        }

        return "User Registered";
    }

    public String registerVerified(String verifiedIdentifier, String otp, String email, String phone, String password, String username, String panNumber) {
        String lowerVerifiedId = verifiedIdentifier.toLowerCase();
        if (!otpService.verifyOtp(lowerVerifiedId, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        RegisterRequest req = new RegisterRequest();
        req.setEmail(email != null ? email.toLowerCase() : null);
        req.setPhone(phone);
        req.setPassword(password);
        req.setUsername(username);
        req.setPanNumber(panNumber);
        return register(req);
    }

    // ===========================
    // 🔐 LOGIN
    // ===========================
    public String login(LoginRequest request) {

        UserEntity user;

        // 🔍 find user
        if (request.getEmail() != null) {
            String email = request.getEmail().toLowerCase();
            user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } else {
            user = userRepo.findByPhone(request.getPhone())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        // 🔐 password check
        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String username = user.getEmail() != null
                ? user.getEmail()
                : user.getPhone();

        String token = jwtUtil.generateToken(username);

        // 🔥 unique session
        user.setActiveToken(token);
        userRepo.save(user);

        return token;
    }

    // ===========================
    // 📩 OTP FLOWS
    // ===========================

    public void sendAuthOtp(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new RuntimeException("Identifier is required");
        }
        otpService.generateAndSendOtp(identifier.toLowerCase(), "Authentication for " + identifier);
    }

    public String loginWithOtp(String identifier, String otp) {
        String lowerId = identifier.toLowerCase();
        if (!otpService.verifyOtp(lowerId, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        UserEntity user = userRepo.findByEmail(lowerId)
                .orElseGet(() -> userRepo.findByPhone(identifier)
                        .orElse(null));

        if (user == null) {
            // Auto register the user if they don't exist? The user wanted signup via OTP too.
            RegisterRequest req = new RegisterRequest();
            if (lowerId.contains("@")) {
                req.setEmail(lowerId);
            } else {
                req.setPhone(identifier);
            }
            req.setPassword(UUID.randomUUID().toString()); // dummy password for OTP users
            register(req);
            
            user = userRepo.findByEmail(lowerId)
                .orElseGet(() -> userRepo.findByPhone(identifier)
                        .orElseThrow(() -> new RuntimeException("Failed to auto-register user")));
        }

        String username = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String token = jwtUtil.generateToken(username);
        user.setActiveToken(token);
        userRepo.save(user);

        return token;
    }

    public void resetPassword(String identifier, String otp, String newPassword) {
        String lowerId = identifier.toLowerCase();
        if (!otpService.verifyOtp(lowerId, otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        UserEntity user = userRepo.findByEmail(lowerId)
                .orElseGet(() -> userRepo.findByPhone(identifier)
                        .orElseThrow(() -> new RuntimeException("User not found")));

        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);
    }
}