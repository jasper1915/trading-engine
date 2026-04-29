package com.trading.engine.controller;

import com.trading.engine.model.AuthResponse;
import com.trading.engine.model.LoginRequest;
import com.trading.engine.model.RegisterRequest;
import com.trading.engine.service.AuthService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/register-verified")
    public java.util.Map<String, String> registerVerified(@RequestBody java.util.Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String otp = payload.get("otp");
        String password = payload.get("password");
        String username = payload.get("username");
        String panNumber = payload.get("panNumber");
        authService.registerVerified(identifier, otp, password, username, panNumber);
        return java.util.Map.of("message", "User Registered successfully");
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return new AuthResponse(token);
    }

    @PostMapping("/send-otp")
    public java.util.Map<String, String> sendOtp(@RequestBody java.util.Map<String, String> payload) {
        String identifier = payload.get("identifier");
        authService.sendAuthOtp(identifier);
        return java.util.Map.of("message", "OTP sent successfully to " + identifier);
    }

    @PostMapping("/login-otp")
    public AuthResponse loginOtp(@RequestBody java.util.Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String otp = payload.get("otp");
        String token = authService.loginWithOtp(identifier, otp);
        return new AuthResponse(token);
    }

    @PostMapping("/reset-password")
    public java.util.Map<String, String> resetPassword(@RequestBody java.util.Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        authService.resetPassword(identifier, otp, newPassword);
        return java.util.Map.of("message", "Password reset successfully");
    }
}