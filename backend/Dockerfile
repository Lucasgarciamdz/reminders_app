FROM amazoncorretto:17

# Set working directory
WORKDIR /app

# Copy the JAR file
COPY target/*.jar app.jar


# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/management/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]