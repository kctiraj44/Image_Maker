FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Jammy supplies Python 3.10, which is supported by the pinned rembg release.
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt background_removal.py ./
RUN python3 -m venv /opt/background-removal-env \
    && /opt/background-removal-env/bin/pip install --no-cache-dir -r requirements.txt \
    && /opt/background-removal-env/bin/python -c "from rembg import new_session; new_session('u2netp')"

ENV PATH="/opt/background-removal-env/bin:${PATH}" \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1
COPY --from=build /build/target/ImageResizeSpringBoot-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Xms64m", "-Xmx160m", "-XX:MaxMetaspaceSize=128m", "-jar", "app.jar"]
