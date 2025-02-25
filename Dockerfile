#FROM gradle:jdk17 AS builder
#LABEL authors="lynxiox"
#
#WORKDIR /app
#
#COPY build.gradle settings.gradle gradle/ ./
#RUN gradle build --no-daemon || true
#
#COPY . .
#
#RUN gradle clean build -x test --no-daemon
#
#FROM openjdk:17-alpine AS runtime
#LABEL authors="lynxiox"
#
#WORKDIR /app
#
#RUN apk add --no-cache gettext
#
#COPY --from=builder /app/build/libs/*.jar app.jar
#
#EXPOSE 3000
#
#RUN mkdir -p /app/static/js
#
#COPY src/main/resources/static/js/config.js.template /app/config.js.template
#
#RUN envsubst < /app/config.js.template > /app/static/js/config.js
#
#RUN rm /app/config.js.template
#
#ENTRYPOINT ["java", "-jar", "/app/app.jar"]
FROM gradle:jdk17 AS builder
LABEL authors="lynxiox"

WORKDIR /app

COPY build.gradle settings.gradle gradle/ ./
RUN gradle build --no-daemon || true

COPY . .

RUN gradle clean build -x test --no-daemon

FROM openjdk:17-alpine AS runtime
LABEL authors="lynxiox"

WORKDIR /app

RUN apk add --no-cache gettext

ARG BASE_URL

# Установим переменную окружения BASE_URL
ENV BASE_URL=${BASE_URL}

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 3000

RUN mkdir -p /app/static/js

COPY src/main/resources/static/js/config.js.template /app/config.js.template

# Подставим значение BASE_URL в config.js
RUN envsubst < /app/config.js.template > /app/static/js/config.js

RUN rm /app/config.js.template

ENTRYPOINT ["java", "-jar", "/app/app.jar"]



