package com.trading.engine.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;
import jakarta.annotation.PostConstruct;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    @Value("${aws.access-key}")
    private String awsAccessKey;

    @Value("${aws.secret-key}")
    private String awsSecretKey;

    @Value("${aws.region}")
    private String awsRegion;

    @Value("${aws.sender-email}")
    private String senderEmail;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-name:Stockify}")
    private String brevoSenderName;

    @Value("${brevo.sender-email:}")
    private String brevoSenderEmail;

    @Value("${msg91.auth-key:}")
    private String msg91AuthKey;

    @Value("${msg91.template-id:}")
    private String msg91TemplateId;

    @Value("${fast2sms.api-key:}")
    private String fast2smsApiKey;

    @Value("${twilio.account-sid:}")
    private String twilioSid;

    @Value("${twilio.auth-token:}")
    private String twilioToken;

    @Value("${twilio.phone-number:}")
    private String twilioFrom;

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();

    private SesClient sesClient;

    @PostConstruct
    public void init() {
        if (awsAccessKey != null && !awsAccessKey.isEmpty() && !awsAccessKey.contains("your-aws")) {
            StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(awsAccessKey, awsSecretKey));
            this.sesClient = SesClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
        }

        if (twilioSid != null && !twilioSid.isEmpty() && !twilioSid.contains("your-twilio")) {
            Twilio.init(twilioSid, twilioToken);
        }
    }

    public void generateAndSendOtp(String identifier, String action) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(identifier, otp);

        // 🔥 DEBUG OUTPUT FOR TERMINAL
        System.out.println("\n========================================");
        System.out.println("🚀 [FORTUNEX OTP DEBUG]");
        System.out.println("USER: " + identifier);
        System.out.println("CODE: " + otp);
        System.out.println("========================================\n");

        String textMessage = "Your Stockify Verification Code is: " + otp;

        // Attempt to send REAL Email via Brevo
        if (identifier.contains("@")) {
            try {
                if (brevoApiKey != null && !brevoApiKey.isEmpty() && !brevoApiKey.contains("your-brevo")) {
                    // Prepare Brevo API Request
                    java.util.Map<String, Object> sender = java.util.Map.of("name", brevoSenderName, "email", brevoSenderEmail);
                    java.util.List<java.util.Map<String, String>> to = java.util.List.of(java.util.Map.of("email", identifier));
                    
                    java.util.Map<String, Object> body = java.util.Map.of(
                        "sender", sender,
                        "to", to,
                        "subject", "Stockify OTP Verification",
                        "textContent", textMessage
                    );

                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                    headers.set("api-key", brevoApiKey);
                    headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

                    org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(body, headers);
                    
                    restTemplate.postForObject("https://api.brevo.com/v3/smtp/email", request, String.class);
                    System.out.println("✅ REAL Brevo Email Sent to " + identifier);
                } else {
                    System.out.println("⚠️ Brevo not configured. Fallback OTP: " + otp);
                }
            } catch (Exception e) {
                String errorMsg = "❌ Brevo Error: " + e.getMessage();
                System.err.println(errorMsg);
                logError(errorMsg);
            }
        }
        // Attempt to send REAL SMS via Twilio or MSG91
        else {
            try {
                // Priority 1: Twilio
                if (twilioSid != null && !twilioSid.isEmpty() && !twilioToken.contains("PASTE")) {
                    String finalNumber = identifier.replace("+", "").trim();
                    // If it's a 10-digit number, prepend the India country code +91
                    if (finalNumber.length() == 10) {
                        finalNumber = "+91" + finalNumber;
                    } else if (!finalNumber.startsWith("+")) {
                        finalNumber = "+" + finalNumber;
                    }

                    System.out.println("DEBUG: Sending Twilio SMS to: " + finalNumber);

                    Message message = Message.creator(
                            new PhoneNumber(finalNumber),
                            new PhoneNumber(twilioFrom),
                            textMessage).create();
                    System.out.println("✅ REAL Twilio SMS Sent! SID: " + message.getSid());
                }
                // Priority 2: MSG91
                else if (msg91AuthKey != null && !msg91AuthKey.isEmpty()) {
                    String sanitizedMobile = identifier.replace("+", "").trim();
                    // For MSG91, we send country=91 separately and the 10-digit number as mobile
                    if (sanitizedMobile.startsWith("91") && sanitizedMobile.length() > 10) {
                        sanitizedMobile = sanitizedMobile.substring(2);
                    }

                    String url = String.format(
                            "https://api.msg91.com/api/v5/otp?template_id=%s&mobile=%s&authkey=%s&otp=%s&country=91",
                            msg91TemplateId, sanitizedMobile, msg91AuthKey, otp);
                    restTemplate.getForObject(url, String.class);
                    System.out.println("✅ REAL MSG91 SMS Sent to " + sanitizedMobile);
                }
                // Priority 3: Fast2SMS (DLT-Free for India)
                else if (fast2smsApiKey != null && !fast2smsApiKey.isEmpty()) {
                    String sanitizedMobile = identifier.replace("+", "").replace(" ", "").trim();
                    // If it's 12 digits starting with 91, strip the 91
                    if (sanitizedMobile.length() == 12 && sanitizedMobile.startsWith("91")) {
                        sanitizedMobile = sanitizedMobile.substring(2);
                    }
                    // If it's 10 digits starting with 91, it's likely a mistake or a real number starting with 91.
                    // We will keep it but log it.

                    // Using Fast2SMS 'otp' route (now that account is funded)
                    String sanitizedMobile = identifier.replace("+", "").replace(" ", "").trim();
                    if (sanitizedMobile.length() > 10 && sanitizedMobile.startsWith("91")) {
                        sanitizedMobile = sanitizedMobile.substring(2);
                    }
                    
                    String url = String.format(
                        "https://www.fast2sms.com/dev/bulkV2?authorization=%s&variables_values=%s&route=otp&numbers=%s",
                        fast2smsApiKey, otp, sanitizedMobile);
                    
                    System.out.println("📡 Fast2SMS (OTP Route) URL: " + url);
                    String response = restTemplate.getForObject(url, String.class);
                    System.out.println("✅ Fast2SMS Response: " + response);
                    System.out.println("✅ REAL Fast2SMS OTP Sent to " + sanitizedMobile);
                }
            } catch (Exception e) {
                String errorMsg = "❌ SMS Error: " + e.getMessage();
                System.err.println(errorMsg);
                logError(errorMsg);
            }
        }

        // Always write to file for developer debug
        try {
            String msg = java.time.LocalDateTime.now() + " - Identifier: " + identifier + " OTP: " + otp + "\n";
            Files.write(Paths.get("otp.txt"), msg.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
    }

    public boolean verifyOtp(String identifier, String otp) {
        String storedOtp = otpStorage.get(identifier);
        return otp != null && otp.equals(storedOtp);
    }

    private void logError(String msg) {
        try {
            String logMsg = new java.util.Date() + ": " + msg + "\n";
            Files.write(Paths.get("otp_errors.log"), logMsg.getBytes(), StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
    }
}
