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
            System.out.println("Running automatic database migrations...");
            // Force the profile_pic column to be TEXT to hold large Base64 images
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN profile_pic TYPE TEXT");
            
            // Add is2fa_enabled column if it doesn't exist
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is2fa_enabled BOOLEAN DEFAULT FALSE");
            
            System.out.println("Migration successful: Database columns are up to date.");
        } catch (Exception e) {
            System.out.println("Migration info: " + e.getMessage());
        }
    }
}
