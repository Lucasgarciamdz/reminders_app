#!/bin/bash

echo "=== Jenkins Troubleshooting Information ==="
echo ""

echo "1. System Information:"
echo "   OS: $(uname -a)"
echo "   Docker version: $(docker --version)"
echo "   Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version)"
echo "   Available memory: $(free -h | grep Mem | awk '{print $7}')"
echo "   Available disk: $(df -h / | awk 'NR==2 {print $4}')"
echo ""

echo "2. Docker Status:"
docker ps -a | grep jenkins || echo "   No Jenkins containers found"
echo ""

echo "3. Jenkins Logs (last 50 lines):"
docker logs --tail 50 jenkins-ci 2>/dev/null || echo "   Jenkins container not running"
echo ""

echo "4. Port Status:"
netstat -tlnp | grep :8080 || echo "   Port 8080 not in use"
echo ""

echo "5. Jenkins Home Directory:"
ls -la ~/jenkins_home/ 2>/dev/null || echo "   Jenkins home directory not found"
echo ""

echo "6. Docker Socket Permissions:"
ls -la /var/run/docker.sock
echo ""

echo "=== Common Solutions ==="
echo "1. If Jenkins won't start:"
echo "   - Check if port 8080 is available: sudo lsof -i :8080"
echo "   - Restart Docker: sudo systemctl restart docker"
echo "   - Check disk space: df -h"
echo ""
echo "2. If Docker permission denied:"
echo "   - Add user to docker group: sudo usermod -aG docker \$USER"
echo "   - Logout and login again"
echo ""
echo "3. If Jenkins is slow:"
echo "   - Increase memory: Edit docker-compose.jenkins.yml JAVA_OPTS"
echo "   - Clean up: docker system prune -f"
