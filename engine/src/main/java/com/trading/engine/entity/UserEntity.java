package com.trading.engine.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private String id;

    private String username;
    private String password;
    private String email;
    private String phone;

    // 🔥 for unique session
    private String activeToken;

    private String panNumber;

    @jakarta.persistence.Column(columnDefinition = "TEXT")
    private String profilePic;

    private boolean is2faEnabled = false;

    // ================= GETTERS =================

    public String getId() { return id; }

    public String getUsername() { return username; }

    public String getPassword() { return password; }

    public String getEmail() { return email; }   // ✅ FIXED

    public String getPhone() { return phone; }   // ✅ FIXED

    public String getActiveToken() { return activeToken; }

    public String getPanNumber() { return panNumber; }

    public String getProfilePic() { return profilePic; }

    public boolean isIs2faEnabled() { return is2faEnabled; }

    // ================= SETTERS =================

    public void setId(String id) { this.id = id; }

    public void setUsername(String username) { this.username = username; }

    public void setPassword(String password) { this.password = password; }

    public void setEmail(String email) { this.email = email; }   // ✅ FIXED

    public void setPhone(String phone) { this.phone = phone; }   // ✅ FIXED

    public void setActiveToken(String activeToken) {
        this.activeToken = activeToken;
    }

    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public void setProfilePic(String profilePic) { this.profilePic = profilePic; }

    public void setIs2faEnabled(boolean is2faEnabled) { this.is2faEnabled = is2faEnabled; }
}