package com.trading.engine.controller;

import com.trading.engine.entity.UserEntity;
import com.trading.engine.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserRepository userRepository;
    private final com.trading.engine.security.JwtUtil jwtUtil;
    private final com.trading.engine.service.OtpService otpService;
    private final org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

    public UserController(UserRepository userRepository, com.trading.engine.security.JwtUtil jwtUtil, com.trading.engine.service.OtpService otpService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByPhone(username)
                .orElseThrow(() -> new RuntimeException("User not found")));

        return Map.of(
            "id", user.getId(),
            "username", user.getUsername() != null ? user.getUsername() : "Not provided",
            "email", user.getEmail() != null ? user.getEmail() : "Not provided",
            "phone", user.getPhone() != null ? user.getPhone() : "Not provided",
            "kycStatus", "VERIFIED",
            "panNumber", user.getPanNumber() != null ? user.getPanNumber() : "Not provided",
            "profilePic", user.getProfilePic() != null ? user.getProfilePic() : "",
            "is2faEnabled", user.isIs2faEnabled()
        );
    }

    @PostMapping("/send-otp")
    public Map<String, String> sendOtp(@RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String field = payload.get("field");
        String newValue = payload.get("newValue");

        otpService.generateAndSendOtp(username, "Update " + field + " to " + newValue);

        return Map.of("message", "OTP sent successfully");
    }

    @PostMapping("/update-profile")
    public Map<String, Object> updateProfile(@RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByPhone(username)
                .orElseThrow(() -> new RuntimeException("User not found")));

        String field = payload.get("field");
        String newValue = payload.get("newValue");
        String otp = payload.get("otp");

        boolean requiresOtp = "email".equals(field) || "phone".equals(field);

        if (requiresOtp) {
            if (!otpService.verifyOtp(username, otp)) {
                throw new RuntimeException("Invalid or expired OTP");
            }
        }

        if ("email".equals(field)) {
            user.setEmail(newValue);
        } else if ("phone".equals(field)) {
            user.setPhone(newValue);
        } else if ("username".equals(field)) {
            user.setUsername(newValue);
        } else if ("panNumber".equals(field)) {
            user.setPanNumber(newValue);
        } else if ("profilePic".equals(field)) {
            user.setProfilePic(newValue);
        } else {
            throw new RuntimeException("Invalid field");
        }

        userRepository.save(user);

        // Generate a new token with the new primary contact to keep the session alive
        String newPrimary = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String newToken = jwtUtil.generateToken(newPrimary);
        
        // Update active token
        user.setActiveToken(newToken);
        userRepository.save(user);

        return Map.of(
            "message", "Profile updated successfully",
            "token", newToken
        );
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(@RequestBody Map<String, String> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByPhone(username)
                .orElseThrow(() -> new RuntimeException("User not found")));

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        return Map.of("message", "Password changed successfully");
    }

    @PostMapping("/toggle-2fa")
    public Map<String, Object> toggle2fa(@RequestBody Map<String, Boolean> payload) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByPhone(username)
                .orElseThrow(() -> new RuntimeException("User not found")));

        boolean enable = payload.get("enable");
        user.setIs2faEnabled(enable);
        userRepository.save(user);

        return Map.of(
            "message", "2FA " + (enable ? "enabled" : "disabled") + " successfully",
            "is2faEnabled", user.isIs2faEnabled()
        );
    }
}
