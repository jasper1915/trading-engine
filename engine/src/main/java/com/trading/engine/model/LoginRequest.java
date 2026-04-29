package com.trading.engine.model;

public class LoginRequest {

    private String username;
    private String password;
    private String email;
    private String phone;

    // ================= GETTERS =================

    public String getUsername() { return username; }

    public String getPassword() { return password; }

    public String getEmail() { return email; }   // ✅ FIXED

    public String getPhone() { return phone; }   // ✅ FIXED

    // ================= SETTERS =================

    public void setUsername(String username) { this.username = username; }

    public void setPassword(String password) { this.password = password; }

    public void setEmail(String email) { this.email = email; }   // ✅ FIXED

    public void setPhone(String phone) { this.phone = phone; }   // ✅ FIXED
}