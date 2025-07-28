#!/bin/bash

case "$1" in
    start)
        echo "Starting Jenkins..."
        docker-compose -f docker-compose.jenkins.yml up -d
        ;;
    stop)
        echo "Stopping Jenkins..."
        docker-compose -f docker-compose.jenkins.yml down
        ;;
    restart)
        echo "Restarting Jenkins..."
        docker-compose -f docker-compose.jenkins.yml restart
        ;;
    logs)
        echo "Showing Jenkins logs..."
        docker logs -f jenkins-ci
        ;;
    backup)
        echo "Creating Jenkins backup..."
        tar -czf "jenkins-backup-$(date +%Y%m%d-%H%M%S).tar.gz" ~/jenkins_home
        echo "Backup created: jenkins-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        ;;
    status)
        echo "Jenkins status:"
        docker ps | grep jenkins-ci || echo "Jenkins is not running"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|backup|status}"
        exit 1
        ;;
esac
