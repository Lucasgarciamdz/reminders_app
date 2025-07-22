package ar.edu.um.service;

import ar.edu.um.config.LogstashLogger;
import ar.edu.um.domain.Reminder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Example service showing how to integrate LogstashLogger
 * for structured logging in your application
 */
@Service
public class ReminderServiceWithLogging {
    
    private static final Logger logger = LoggerFactory.getLogger(ReminderServiceWithLogging.class);
    
    @Autowired
    private LogstashLogger logstashLogger;
    
    public Reminder createReminder(Reminder reminder, String username) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Log user action
            Map<String, Object> actionData = new HashMap<>();
            actionData.put("reminder_title", reminder.getTitle());
            actionData.put("reminder_priority", reminder.getPriority());
            actionData.put("due_date", reminder.getDueDate());
            
            logstashLogger.sendUserActionLog("create_reminder", username, actionData);
            
            // Your business logic here
            Reminder savedReminder = saveReminder(reminder);
            
            // Log successful creation
            Map<String, Object> successData = new HashMap<>();
            successData.put("reminder_id", savedReminder.getId());
            successData.put("created_by", username);
            
            logstashLogger.sendLog("INFO", "Reminder created successfully", 
                                 "ReminderService", successData);
            
            // Log performance
            long duration = System.currentTimeMillis() - startTime;
            Map<String, Object> perfData = new HashMap<>();
            perfData.put("reminder_id", savedReminder.getId());
            
            logstashLogger.sendPerformanceLog("create_reminder", duration, perfData);
            
            return savedReminder;
            
        } catch (Exception e) {
            // Log error with context
            Map<String, Object> errorContext = new HashMap<>();
            errorContext.put("username", username);
            errorContext.put("reminder_title", reminder.getTitle());
            
            logstashLogger.sendErrorLog("Failed to create reminder", 
                                      "ReminderService", e);
            
            throw e;
        }
    }
    
    public void deleteReminder(Long reminderId, String username) {
        try {
            // Log deletion attempt
            Map<String, Object> deleteData = new HashMap<>();
            deleteData.put("reminder_id", reminderId);
            deleteData.put("deleted_by", username);
            
            logstashLogger.sendUserActionLog("delete_reminder", username, deleteData);
            
            // Your deletion logic here
            performDelete(reminderId);
            
            // Log successful deletion
            logstashLogger.sendLog("INFO", "Reminder deleted successfully", 
                                 "ReminderService", deleteData);
            
        } catch (Exception e) {
            Map<String, Object> errorContext = new HashMap<>();
            errorContext.put("reminder_id", reminderId);
            errorContext.put("username", username);
            
            logstashLogger.sendErrorLog("Failed to delete reminder", 
                                      "ReminderService", e);
            throw e;
        }
    }
    
    public void completeReminder(Long reminderId, String username) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Log completion action
            Map<String, Object> completionData = new HashMap<>();
            completionData.put("reminder_id", reminderId);
            completionData.put("completed_by", username);
            completionData.put("completion_time", System.currentTimeMillis());
            
            logstashLogger.sendUserActionLog("complete_reminder", username, completionData);
            
            // Your completion logic here
            markAsCompleted(reminderId);
            
            // Log performance for completion
            long duration = System.currentTimeMillis() - startTime;
            logstashLogger.sendPerformanceLog("complete_reminder", duration, completionData);
            
        } catch (Exception e) {
            logstashLogger.sendErrorLog("Failed to complete reminder", 
                                      "ReminderService", e);
            throw e;
        }
    }
    
    // Mock methods - replace with your actual implementation
    private Reminder saveReminder(Reminder reminder) {
        // Your save logic
        return reminder;
    }
    
    private void performDelete(Long reminderId) {
        // Your delete logic
    }
    
    private void markAsCompleted(Long reminderId) {
        // Your completion logic
    }
}