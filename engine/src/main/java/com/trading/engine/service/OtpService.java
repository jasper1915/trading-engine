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

    @Value("${msg91.auth-key}")
    private String msg91AuthKey;

    @Value("${msg91.template-id}")
    private String msg91TemplateId;

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
                    AwsBasicCredentials.create(awsAccessKey, awsSecretKey)
            );
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

        String textMessage = "Your FortuneX Verification Code is: " + otp;

        // Attempt to send REAL Email via AWS SES
        if (identifier.contains("@")) {
            try {
                if (sesClient == null) {
                    System.out.println("⚠️ AWS SES not configured. FALLBACK OTP: " + otp);
                } else {
                    SendEmailRequest emailRequest = SendEmailRequest.builder()
                            .destination(Destination.builder().toAddresses(identifier).build())
                            .message(software.amazon.awssdk.services.ses.model.Message.builder()
                                    .subject(Content.builder().data("FortuneX OTP Verification").build())
                                    .body(Body.builder().text(Content.builder().data(textMessage).build()).build())
                                    .build())
                            .source(senderEmail)
                            .build();
                    sesClient.sendEmail(emailRequest);
                    System.out.println("✅ REAL AWS SES Email Sent to " + identifier);
                }
            } catch (Exception e) {
                String errorMsg = "❌ AWS SES Error: " + e.getMessage();
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
                        textMessage
                    ).create();
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
                        msg91TemplateId, sanitizedMobile, msg91AuthKey, otp
                    );
                    String response = restTemplate.getForObject(url, String.class);
                    System.out.println("✅ MSG91 Response: " + response);
                    System.out.println("✅ REAL MSG91 SMS Sent to " + sanitizedMobile);
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
        } catch (Exception ignored) {}
    }

    public boolean verifyOtp(String identifier, String otp) {
        String storedOtp = otpStorage.get(identifier);
        return otp != null && otp.equals(storedOtp);
    }

    private void logError(String msg) {
        try {
            String logMsg = new java.util.Date() + ": " + msg + "\n";
            Files.write(Paths.get("otp_errors.log"), logMsg.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {}
    }
}
