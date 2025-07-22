# ELK Stack Setup Guide for Reminders Application

## Overview

This guide helps you implement a complete ELK Stack (Elasticsearch, Logstash, Kibana) for log management in your JHipster Reminders application. The setup extends your existing Elasticsearch configuration to include comprehensive logging capabilities.

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Application   │───▶│   Logstash   │───▶│ Elasticsearch   │
│     Logs        │    │  (Process)   │    │   (Storage)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                     │
┌─────────────────┐    ┌──────────────┐             │
│  Docker Logs    │───▶│   Filebeat   │─────────────┘
│   (Containers)  │    │  (Collect)   │
└─────────────────┘    └──────────────┘             │
                                                     ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │    Kibana    │◀───│ Elasticsearch   │
                       │ (Visualize)  │    │    (Query)      │
                       └──────────────┘    └─────────────────┘
```

## Quick Start

### Option 1: Integrated with Existing Docker Compose

1. **Use the updated docker-compose.yml** (already modified in your project)
2. **Start the complete stack:**
   ```bash
   docker-compose up -d
   ```

### Option 2: Standalone ELK Stack

1. **Navigate to ELK directory:**
   ```bash
   cd elk
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup-elk.sh
   ./setup-elk.sh
   ```

3. **Or manually start:**
   ```bash
   docker-compose -f docker-compose.elk.yml up -d
   ```

## Configuration Details

### Logstash Pipelines

The setup includes three specialized pipelines:

#### 1. Main Pipeline (`main.conf`)
- **Purpose**: General log processing
- **Inputs**: 
  - Beats (port 5044)
  - TCP JSON (port 5000)
  - UDP Syslog (port 5001)
  - HTTP (port 8080)
- **Index**: `logstash-main-YYYY.MM.dd`

#### 2. Docker Logs Pipeline (`docker-logs.conf`)
- **Purpose**: Process Docker container logs
- **Input**: Docker container log files
- **Features**:
  - Automatic service detection
  - Spring Boot log parsing
  - Nginx access log parsing
- **Indices**: 
  - `backend-logs-YYYY.MM.dd`
  - `frontend-logs-YYYY.MM.dd`
  - `docker-logs-YYYY.MM.dd`

#### 3. Application Logs Pipeline (`application-logs.conf`)
- **Purpose**: Direct application log processing
- **Inputs**:
  - TCP JSON (port 5002)
  - HTTP (port 8081)
- **Features**:
  - Spring Boot pattern recognition
  - Log level categorization
  - Thread and logger extraction
- **Index**: `application-logs-YYYY.MM.dd`

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Elasticsearch | 9200 | HTTP API |
| Elasticsearch | 9300 | Transport |
| Kibana | 5601 | Web Interface |
| Logstash API | 9600 | Monitoring |
| Logstash Beats | 5044 | Filebeat input |
| Logstash TCP | 5000 | JSON logs |
| Logstash UDP | 5001 | Syslog |
| Logstash App TCP | 5002 | Application logs |
| Logstash HTTP | 8080 | General HTTP |
| Logstash App HTTP | 8081 | Application HTTP |

## Application Integration

### Spring Boot Integration

Add to your `application.yml`:

```yaml
logging:
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %5p %t --- [%15.15t] %-40.40logger{39} : %m%n"
  level:
    root: INFO
    ar.edu.um: DEBUG

# Optional: Send logs to Logstash via TCP
management:
  endpoints:
    web:
      exposure:
        include: health,info,loggers
```

### Docker Logging Configuration

Your containers are already configured with:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service,environment"
labels:
  - "service=backend"
  - "environment=production"
```

### Programmatic Log Sending

#### Java/Spring Boot Example:

```java
// Add to your application
@Component
public class LogstashLogger {
    
    private static final String LOGSTASH_HOST = "localhost";
    private static final int LOGSTASH_PORT = 5002;
    
    public void sendLog(String level, String message, String logger) {
        try (Socket socket = new Socket(LOGSTASH_HOST, LOGSTASH_PORT);
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
            
            String jsonLog = String.format(
                "{\"timestamp\":\"%s\",\"level\":\"%s\",\"logger\":\"%s\",\"message\":\"%s\"}",
                Instant.now().toString(), level, logger, message
            );
            out.println(jsonLog);
        } catch (IOException e) {
            // Handle error
        }
    }
}
```

#### JavaScript/Node.js Example:

```javascript
const net = require('net');

function sendLogToLogstash(level, message, logger) {
    const client = new net.Socket();
    const logData = {
        timestamp: new Date().toISOString(),
        level: level,
        logger: logger,
        message: message
    };
    
    client.connect(5002, 'localhost', () => {
        client.write(JSON.stringify(logData) + '\n');
        client.destroy();
    });
}
```

## Kibana Setup

### 1. Access Kibana
Open http://localhost:5601

### 2. Create Index Patterns

Go to **Stack Management > Index Patterns** and create:

- `application-logs-*` (Application logs)
- `backend-logs-*` (Backend container logs)
- `frontend-logs-*` (Frontend container logs)
- `logstash-main-*` (General logs)
- `filebeat-*` (Filebeat collected logs)

### 3. Explore Logs

Go to **Discover** to start exploring your logs with filters like:
- `level: ERROR`
- `service: backend`
- `logger: ar.edu.um.service.*`

### 4. Create Visualizations

Examples:
- **Log Level Distribution**: Pie chart of log levels
- **Error Rate Over Time**: Line chart of ERROR logs
- **Top Loggers**: Data table of most active loggers
- **Service Health**: Metric showing log volume per service

## Monitoring and Maintenance

### Health Checks

Check service status:
```bash
# Elasticsearch
curl http://localhost:9200/_cluster/health

# Kibana
curl http://localhost:5601/api/status

# Logstash
curl http://localhost:9600/_node/stats
```

### Log Rotation

Elasticsearch indices are created daily. To manage storage:

1. **Set up Index Lifecycle Management (ILM)**
2. **Configure retention policies**
3. **Monitor disk usage**

### Performance Tuning

#### Elasticsearch
- Adjust heap size: `-Xms1g -Xmx1g`
- Monitor cluster health
- Configure proper sharding

#### Logstash
- Tune pipeline workers
- Adjust batch size
- Monitor processing rates

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose logs elasticsearch
   docker-compose logs kibana
   docker-compose logs logstash
   ```

2. **Logs not appearing**
   - Check Logstash pipeline configuration
   - Verify network connectivity
   - Check Elasticsearch indices

3. **Performance issues**
   - Increase memory allocation
   - Reduce log verbosity
   - Optimize Logstash filters

### Useful Commands

```bash
# View logs
docker-compose logs -f logstash

# Restart services
docker-compose restart logstash

# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices?v

# Test Logstash input
echo '{"message":"test","level":"INFO"}' | nc localhost 5000
```

## Security Considerations

For production deployment:

1. **Enable Elasticsearch security**
2. **Configure SSL/TLS**
3. **Set up authentication**
4. **Network security**
5. **Log data encryption**

## Next Steps

1. **Set up alerting** for critical errors
2. **Create custom dashboards** for your application
3. **Implement log aggregation** from multiple environments
4. **Set up automated log analysis**
5. **Configure backup and disaster recovery**

## Support

For issues or questions:
1. Check Elasticsearch/Logstash/Kibana documentation
2. Review Docker container logs
3. Verify network connectivity
4. Check configuration files syntax