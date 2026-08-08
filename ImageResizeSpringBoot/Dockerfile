FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
COPY --from=build /build/target/ImageResizeSpringBoot-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Xms64m", "-Xmx160m", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
