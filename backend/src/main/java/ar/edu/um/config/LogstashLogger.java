package ar.edu.um.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * LogstashLogger - Sends structured logs to Logstash via TCP
 * 
 * Usage:
 * @Autowired
 * private LogstashLogger logstashLogger;
 * 
 * logstashLogger.sendLog("INFO", "User logged in", "UserService", Map.of("userId", 123));
 */
@Component
public class LogstashLogger {
    
    private static final Logger logger = LoggerFactory.getLogger(LogstashLogger.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${elk.logstash.host:localhost}")
    private String logstashHost;
    
    @Value("${elk.logstash.port:5002}")
    private int logstashPort;
    
    @Value("${elk.logstash.enabled:true}")
    private boolean enabled;
    
    @Value("${elk.application.name:reminders-app}")
    private String applicationName;
    
    @Value("${elk.application.environment:development}")
    private String environment;
    
    /**
     * Send a structured log message to Logstash
     */
    public void sendLog(String level, String message, String loggerName) {
        sendLog(level, message, loggerName, null);
    }
    
    /**
     * Send a structured log message to Logstash with additional fields
     */
    public void sendLog(String level, String message, String loggerName, Map<String, Object> additionalFields) {
        if (!enabled) {
            return;
        }
        
        try {
            Map<String, Object> logData = createLogData(level, message, loggerName, additionalFields);
            String jsonLog = objectMapper.writeValueAsString(logData);
            
            sendToLogstash(jsonLog);
            
        } catch (Exception e) {
            logger.warn("Failed to send log to Logstash: {}", e.getMessage());
        }
    }
    
    /**
     * Send error log with exception details
     */
    public void sendErrorLog(String message, String loggerName, Throwable throwable) {
        Map<String, Object> errorFields = new HashMap<>();
        errorFields.put("exception_class", throwable.getClass().getSimpleName());
        errorFields.put("exception_message", throwable.getMessage());
        errorFields.put("stack_trace", getStackTrace(throwable));
        
        sendLog("ERROR", message, loggerName, errorFields);
    }
    
    /**
     * Send user action log
     */
    public void sendUserActionLog(String action, String username, Map<String, Object> actionData) {
        Map<String, Object> userFields = new HashMap<>();
        userFields.put("action", action);
        userFields.put("username", username);
        if (actionData != null) {
            userFields.putAll(actionData);
        }
        
        sendLog("INFO", "User action: " + action, "UserActionLogger", userFields);
    }
    
    /**
     * Send performance log
     */
    public void sendPerformanceLog(String operation, long durationMs, Map<String, Object> performanceData) {
        Map<String, Object> perfFields = new HashMap<>();
        perfFields.put("operation", operation);
        perfFields.put("duration_ms", durationMs);
        perfFields.put("performance_category", "timing");
        if (performanceData != null) {
            perfFields.putAll(performanceData);
        }
        
        sendLog("INFO", "Performance: " + operation + " took " + durationMs + "ms", "PerformanceLogger", perfFields);
    }
    
    private Map<String, Object> createLogData(String level, String message, String loggerName, Map<String, Object> additionalFields) {
        Map<String, Object> logData = new HashMap<>();
        logData.put("timestamp", Instant.now().toString());
        logData.put("level", level);
        logData.put("logger", loggerName);
        logData.put("message", message);
        logData.put("application", applicationName);
        logData.put("environment", environment);
        logData.put("thread", Thread.currentThread().getName());
        
        if (additionalFields != null) {
            logData.putAll(additionalFields);
        }
        
        return logData;
    }
    
    private void sendToLogstash(String jsonLog) {
        try (Socket socket = new Socket(logstashHost, logstashPort);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
            
            out.println(jsonLog);
            
        } catch (IOException e) {
            logger.warn("Failed to connect to Logstash at {}:{} - {}", logstashHost, logstashPort, e.getMessage());
        }
    }
    
    private String getStackTrace(Throwable throwable) {
        StringBuilder sb = new StringBuilder();
        sb.append(throwable.toString()).append("\n");
        
        for (StackTraceElement element : throwable.getStackTrace()) {
            sb.append("\tat ").append(element.toString()).append("\n");
        }
        
        if (throwable.getCause() != null) {
            sb.append("Caused by: ").append(getStackTrace(throwable.getCause()));
        }
        
        return sb.toString();
    }
}