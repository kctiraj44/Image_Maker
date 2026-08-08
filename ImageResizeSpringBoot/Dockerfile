FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt background_removal.py ./
RUN python3 -m venv /opt/background-removal-env \
    && /opt/background-removal-env/bin/pip install --no-cache-dir -r requirements.txt

ENV PATH="/opt/background-removal-env/bin:${PATH}"
COPY --from=build /build/target/ImageResizeSpringBoot-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
