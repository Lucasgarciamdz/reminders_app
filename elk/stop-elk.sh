#!/bin/bash

# ELK Stack Stop Script for Reminders Application
# This script stops and optionally cleans up the ELK stack

set -e

echo "🛑 Stopping ELK Stack..."

# Function to stop services
stop_services() {
    echo "📦 Stopping ELK containers..."
    docker-compose -f docker-compose.elk.yml down
    echo "✅ ELK containers stopped"
}

# Function to clean up (remove volumes and data)
cleanup_data() {
    echo "🧹 Cleaning up ELK data..."
    docker-compose -f docker-compose.elk.yml down -v
    docker volume prune -f
    echo "✅ ELK data cleaned up"
}

# Function to remove images
remove_images() {
    echo "🗑️  Removing ELK images..."
    docker rmi $(docker images | grep -E "(elasticsearch|kibana|logstash|filebeat)" | grep "8.11.0" | awk '{print $3}') 2>/dev/null || echo "No ELK images to remove"
    echo "✅ ELK images removed"
}

# Parse command line arguments
case "${1:-stop}" in
    "stop")
        stop_services
        ;;
    "clean")
        cleanup_data
        ;;
    "purge")
        cleanup_data
        remove_images
        ;;
    *)
        echo "Usage: $0 [stop|clean|purge]"
        echo "  stop  - Stop ELK containers (default)"
        echo "  clean - Stop containers and remove volumes"
        echo "  purge - Stop containers, remove volumes and images"
        exit 1
        ;;
esac

echo ""
echo "🎯 ELK Stack operation completed!"
echo ""
echo "📝 To restart:"
echo "   ./setup-elk.sh"
echo ""