package com.trading.engine.model;

public class RegisterRequest {

    private String username;
    private String password;
    private String email;
    private String phone;
    private String panNumber;

    // ================= GETTERS =================

    public String getUsername() { return username; }

    public String getPassword() { return password; }

    public String getEmail() { return email; }

    public String getPhone() { return phone; }

    public String getPanNumber() { return panNumber; }

    // ================= SETTERS =================

    public void setUsername(String username) { this.username = username; }

    public void setPassword(String password) { this.password = password; }

    public void setEmail(String email) { this.email = email; }

    public void setPhone(String phone) { this.phone = phone; }

    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
}