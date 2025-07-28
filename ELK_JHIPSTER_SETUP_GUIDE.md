# JHipster ELK Stack Setup Guide

This guide shows how to set up Elasticsearch, Logstash, and Kibana (ELK) with your JHipster application for centralized logging.

## Overview

The setup extends the existing JHipster Elasticsearch configuration to include:
- **Elasticsearch**: Search and analytics engine (already configured by JHipster)
- **Logstash**: Log processing pipeline that receives logs from your Spring Boot app
- **Kibana**: Web interface for visualizing logs and creating dashboards

## Quick Start

### 1. Start the ELK Stack

```bash
cd backend/src/main/docker
docker-compose -f elasticsearch.yml up -d
```

### 2. Start Your JHipster Application

```bash
cd backend
./mvnw spring-boot:run
```

### 3. Access the Services

- **Kibana**: http://localhost:5601
- **Elasticsearch**: http://localhost:9200
- **Logstash API**: http://localhost:9600

## Configuration Details

### Elasticsearch Configuration
- **Image**: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
- **Ports**: 9200 (HTTP), 9300 (Transport)
- **Memory**: 256MB heap size
- **Security**: Disabled for development

### Logstash Configuration
- **Image**: docker.elastic.co/logstash/logstash:8.13.4
- **Input**: TCP port 5000 (receives JSON logs from JHipster)
- **Output**: Elasticsearch with daily indices (`reminders-logs-YYYY.MM.dd`)
- **Memory**: 256MB heap size

### Kibana Configuration
- **Image**: docker.elastic.co/kibana/kibana:8.13.4
- **Port**: 5601
- **Connected to**: Elasticsearch on port 9200

## Using Kibana

### 1. Create Index Pattern

1. Open Kibana at http://localhost:5601
2. Go to **Management** → **Stack Management** → **Index Patterns**
3. Click **Create index pattern**
4. Enter pattern: `reminders-logs-*`
5. Select `@timestamp` as the time field
6. Click **Create index pattern**

### 2. View Logs

1. Go to **Analytics** → **Discover**
2. Select your `reminders-logs-*` index pattern
3. You'll see all logs from your JHipster application

### 3. Useful Kibana Queries

```
# Filter by log level
level: "error"

# Filter by logger
logger_name: "ar.edu.um.*"

# Filter by specific message
message: "User authentication"

# Combine filters
level: "error" AND logger_name: "ar.edu.um.*"
```

## Log Format

Your JHipster application sends logs in JSON format with these fields:
- `@timestamp`: When the log was created
- `level`: Log level (DEBUG, INFO, WARN, ERROR)
- `logger_name`: Java class that generated the log
- `message`: The actual log message
- `application`: Always "reminders"
- `environment`: Always "development"

## Troubleshooting

### Check Service Health

```bash
# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Logstash
curl http://localhost:9600

# Check Kibana
curl http://localhost:5601/api/status
```

### View Container Logs

```bash
# View all ELK logs
docker-compose -f elasticsearch.yml logs

# View specific service logs
docker-compose -f elasticsearch.yml logs elasticsearch
docker-compose -f elasticsearch.yml logs logstash
docker-compose -f elasticsearch.yml logs kibana
```

### Common Issues

1. **Kibana shows "No data"**
   - Make sure your JHipster app is running and generating logs
   - Check that logstash is receiving data: `docker-compose -f elasticsearch.yml logs logstash`

2. **Connection refused errors**
   - Wait for all services to be healthy (check with `docker-compose -f elasticsearch.yml ps`)
   - Services start in order: Elasticsearch → Logstash → Kibana

3. **Out of memory errors**
   - Increase Docker memory limits
   - Or reduce heap sizes in the docker-compose file

## Stopping the Stack

```bash
cd backend/src/main/docker
docker-compose -f elasticsearch.yml down
```

## Production Considerations

For production use:
1. Enable Elasticsearch security (xpack.security.enabled=true)
2. Use persistent volumes for data
3. Increase memory allocations
4. Set up proper networking and firewall rules
5. Configure log retention policies
6. Set up monitoring and alerting

## Next Steps

- Create custom Kibana dashboards for your application metrics
- Set up log alerts for error conditions
- Configure log retention and cleanup policies
- Add structured logging to your application code