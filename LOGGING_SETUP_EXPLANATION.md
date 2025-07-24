# Understanding Your Current Logging Setup

## Current State Analysis

You have **two different Elasticsearch setups** in your project, which is causing confusion:

### 1. JHipster's Built-in Elasticsearch (Simple)
- **Location**: `backend/src/main/docker/elasticsearch.yml`
- **Version**: Elasticsearch 8.13.4
- **Purpose**: Basic search functionality for your application
- **Features**: Just Elasticsearch, no logging pipeline
- **Usage**: Started with `./mvnw` (uses `src/main/docker/services.yml`)

### 2. Custom ELK Stack (Comprehensive) ⭐ **RECOMMENDED**
- **Location**: `elk/` folder
- **Version**: Elasticsearch 8.11.0 + Kibana + Logstash + Filebeat
- **Purpose**: Complete logging and monitoring solution
- **Features**: Full ELK stack with log processing, visualization, and collection
- **Usage**: Started with `docker compose up -d` or `./elk/setup-elk.sh`

## Why You Should Use the Custom ELK Stack

Your custom ELK stack is **much more powerful** because it includes:

✅ **Elasticsearch** - Data storage and search  
✅ **Logstash** - Log processing and transformation  
✅ **Kibana** - Log visualization and dashboards  
✅ **Filebeat** - Automatic Docker log collection  
✅ **Multiple pipelines** - Different log types handled separately  
✅ **Structured logging** - JSON format with metadata  
✅ **Docker integration** - Automatic container log collection  

## Quick Start Guide

### Step 1: Start Your ELK Stack

```bash
# Option A: Use the main docker compose (includes your app)
docker compose up -d

# Option B: Use standalone ELK stack only
cd elk
./setup-elk.sh
```

### Step 2: Verify Services Are Running

Check that all services are healthy:
```bash
# Check service status
docker compose ps

# Test Elasticsearch
curl http://localhost:9200/_cluster/health

# Test Kibana
curl http://localhost:5601/api/status

# Test Logstash
curl http://localhost:9600/_node/stats
```

**Access URLs:**
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601  
- **Logstash API**: http://localhost:9600

### Step 3: Enable JHipster Logstash Integration

Currently, JHipster's logstash integration is **disabled**. To enable it:

1. **Update your backend configuration** - Add this to `backend/src/main/resources/config/application-dev.yml`:

```yaml
jhipster:
  logging:
    logstash:
      enabled: true        # Enable logstash integration
      host: localhost      # Logstash host
      port: 5000          # Use port 5000 (main pipeline)
      ring-buffer-size: 512
```

2. **For production**, update `backend/src/main/resources/config/application-prod.yml`:

```yaml
jhipster:
  logging:
    logstash:
      enabled: true
      host: logstash       # Use service name in Docker
      port: 5000
      ring-buffer-size: 512
```

### Step 4: Add Enhanced Logging Configuration

Copy the enhanced logging config from `elk/spring-boot-logstash-config.yml` to your application.yml:

```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %5p %t --- [%15.15t] %-40.40logger{39} : %m%n"
  level:
    root: INFO
    ar.edu.um: DEBUG
  file:
    name: logs/application.log
    max-size: 10MB
    max-history: 30

# Custom ELK properties
elk:
  logstash:
    host: localhost
    port: 5002           # Application-specific logs
    enabled: true
  application:
    name: reminders-app
    environment: ${SPRING_PROFILES_ACTIVE:development}
```

### Step 5: Use the LogstashLogger Class

The `elk/LogstashLogger.java` class is ready to use. Copy it to your project:

```bash
# Copy the LogstashLogger to your project
cp elk/LogstashLogger.java backend/src/main/java/ar/edu/um/config/
```

Then use it in your services:

```java
@Service
public class ReminderService {
    
    @Autowired
    private LogstashLogger logstashLogger;
    
    public Reminder createReminder(Reminder reminder) {
        // Log user action
        logstashLogger.sendUserActionLog("create_reminder", 
            getCurrentUser(), 
            Map.of("reminderId", reminder.getId(), "title", reminder.getTitle()));
        
        try {
            Reminder saved = reminderRepository.save(reminder);
            logstashLogger.sendLog("INFO", "Reminder created successfully", "ReminderService");
            return saved;
        } catch (Exception e) {
            logstashLogger.sendErrorLog("Failed to create reminder", "ReminderService", e);
            throw e;
        }
    }
}
```

## How to View Your Logs

### Option 1: Kibana Dashboard (Recommended)

1. **Open Kibana**: http://localhost:5601

2. **Create Index Patterns**:
   - Go to **Stack Management** → **Index Patterns**
   - Create these patterns:
     - `application-logs-*` (Your app logs)
     - `backend-logs-*` (Backend container logs)
     - `logstash-main-*` (General logs)

3. **Explore Logs**:
   - Go to **Discover**
   - Select an index pattern
   - Use filters like:
     - `level: ERROR` (Show only errors)
     - `logger: ar.edu.um.service.*` (Show service logs)
     - `message: "User logged in"` (Search specific messages)

### Option 2: Docker Logs (Quick Check)

```bash
# View backend container logs
docker compose logs -f backend

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f elasticsearch
docker compose logs -f logstash
docker compose logs -f kibana

# View logs with timestamps
docker compose logs -f -t backend
```

### Option 3: Direct Elasticsearch Queries

```bash
# List all indices
curl http://localhost:9200/_cat/indices?v

# Search recent application logs
curl -X GET "localhost:9200/application-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "timestamp": {
        "gte": "now-1h"
      }
    }
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ]
}'
```

## Log Sources and Where They Go

| Log Source | Logstash Pipeline | Elasticsearch Index | Description |
|------------|------------------|-------------------|-------------|
| JHipster Logstash | `main.conf` (port 5000) | `logstash-main-*` | Built-in JHipster logs |
| LogstashLogger | `application-logs.conf` (port 5002) | `application-logs-*` | Structured app logs |
| Docker Containers | `docker-logs.conf` (Filebeat) | `backend-logs-*`, `frontend-logs-*` | Container logs |
| HTTP Logs | `application-logs.conf` (port 8081) | `application-logs-*` | HTTP endpoint logs |

## Testing Your Setup

### Test 1: Send a Test Log

```bash
# Test the main pipeline (JHipster integration)
echo '{"message":"Test from main pipeline","level":"INFO"}' | nc localhost 5000

# Test the application pipeline (LogstashLogger)
echo '{"message":"Test from app pipeline","level":"INFO","logger":"TestLogger"}' | nc localhost 5002
```

### Test 2: Check Logs Appear in Kibana

1. Open Kibana: http://localhost:5601
2. Go to **Discover**
3. Select `logstash-main-*` or `application-logs-*`
4. Look for your test messages

### Test 3: Generate Application Logs

Start your backend application and perform some actions. The logs should appear in:
- **Console**: Your terminal
- **File**: `backend/logs/application.log`
- **Logstash**: Sent to ELK stack (if enabled)
- **Docker**: Container logs via `docker compose logs -f backend`

## Troubleshooting

### Logs Not Appearing in Kibana?

1. **Check Logstash is processing**:
   ```bash
   docker compose logs -f logstash
   ```

2. **Check Elasticsearch indices**:
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

3. **Verify Logstash connectivity**:
   ```bash
   # Test main pipeline
   echo '{"test":"message"}' | nc localhost 5000
   
   # Test app pipeline  
   echo '{"test":"message"}' | nc localhost 5002
   ```

### Services Not Starting?

```bash
# Check service status
docker compose ps

# View service logs
docker compose logs elasticsearch
docker compose logs kibana
docker compose logs logstash

# Restart services
docker compose restart logstash
```

### Performance Issues?

1. **Increase memory** in `docker compose.yml`:
   ```yaml
   elasticsearch:
     environment:
       - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
   ```

2. **Reduce log verbosity** in your application.yml

## Next Steps

1. **Start the ELK stack**: `docker compose up -d`
2. **Enable JHipster logstash**: Update your application-dev.yml
3. **Copy LogstashLogger**: Add structured logging to your services
4. **Open Kibana**: Create index patterns and explore logs
5. **Create dashboards**: Build custom visualizations for your app

## Summary

- **Use your custom ELK stack** (it's much better than JHipster's basic Elasticsearch)
- **Enable JHipster's logstash integration** to send logs to your ELK stack
- **Use LogstashLogger** for structured application logging
- **View logs in Kibana** for the best experience
- **Docker logs** are automatically collected via Filebeat

Your ELK setup is actually quite sophisticated - you just need to connect the pieces together!