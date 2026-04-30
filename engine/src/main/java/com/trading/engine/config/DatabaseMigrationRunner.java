package com.trading.engine.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrate() {
        try {
            // ✅ Force the profile_pic column to be TEXT to hold large Base64 images
            try { jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN profile_pic TYPE TEXT"); } catch(Exception e) {}
            
            // ✅ Add missing columns if they don't exist
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS active_token TEXT");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is2fa_enabled BOOLEAN DEFAULT FALSE");
            
            // ✅ Add missing columns to trades table
            jdbcTemplate.execute("ALTER TABLE trades ADD COLUMN IF NOT EXISTS buyer_username TEXT");
            jdbcTemplate.execute("ALTER TABLE trades ADD COLUMN IF NOT EXISTS seller_username TEXT");
            
            System.out.println("Migration successful: Database columns are up to date.");
        } catch (Exception e) {
            System.err.println("❌ Migration Error: " + e.getMessage());
        }
    }
}
