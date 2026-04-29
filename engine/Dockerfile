# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
# Ensure the maven wrapper is executable
RUN chmod +x ./mvnw
# Build the application
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose port 8080
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
