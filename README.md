# Hosta Hospital - Backend Architecture & Developer Onboarding Guide

Welcome to the **Hosta Hospital** backend repository. 
 This document is designed to give you a comprehensive overview of the architecture, folder structure, technology stack, and engineering patterns used throughout the platform.

---

## 🏗️ 1. High-Level Architecture
This backend is built using a **Microservices Architecture**, prioritizing scalability, fault tolerance, and separation of concerns. 

Instead of a single monolithic server, the backend is split into **20+ independent microservices**. All incoming HTTP and WebSocket traffic flows through a central **API Gateway**, which routes the request to the appropriate microservice. 

Inter-service communication happens in two ways:
1. **Synchronous HTTP Requests:** For immediate data fetching (e.g., getting a user's role from the `role-service`).
2. **Asynchronous Messaging (RabbitMQ):** For event-driven side effects. For example, when an ambulance is registered in the `ambulance-service`, an `AMBULANCE_REGISTERED` event is published to RabbitMQ. The `notification-service` listens to this event and sends out the necessary emails/socket events in the background.

---

## 🛠️ 2. Technology Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Web Framework:** Express.js
- **Database:** PostgreSQL (managed via Neon Tech / local Docker)
- **ORM:** Sequelize
- **Message Broker:** RabbitMQ
- **Caching & Pub/Sub:** Redis
- **Real-time WebSockets:** Socket.io (with `@socket.io/redis-adapter`)
- **Containerization:** Docker & Docker Compose
- **Third-Party Integrations:** Twilio (SMS OTPs), Nodemailer (SMTP Emails), AWS S3 (File Storage), Firebase/FCM (Push Notifications)

---

## 📂 3. Repository Folder Structure

At the root level, you will see a list of microservice directories and configuration files:

```text
hostabackend/
├── api-gateway/            # Central entry point for all traffic. Handles routing, rate limiting, and Circuit Breakers.
├── auth-service/           # Handles user login, registration, JWT generation, and OTPs.
├── hospital-service/       # Manages hospital profiles, settings, and features.
├── doctor-service/         # Manages doctor profiles and schedules.
├── notification-service/   # Centralized background service for Emails, SMS, and Socket broadcasts.
├── socketio-service/       # Dedicated WebSocket server handling real-time client connections.
├── ambulance-service/      # Manages emergency ambulance dispatch and tracking.
├── booking-service/        # Manages appointments between patients and doctors/hospitals.
├── ... (other domain services)
├── docker-compose.yml      # Local development container orchestration.
└── docker-compose.prod.yml # Production container orchestration.
```

### Inside a Typical Microservice (e.g., `auth-service`)
Almost all microservices follow a strict MVC-like pattern to ensure consistency across the codebase:

```text
src/
├── config/         # Database, Environment variables (env.ts), and RabbitMQ setup.
├── controllers/    # "Fat" controllers containing the core business logic and HTTP response handling.
├── models/         # Sequelize ORM definitions (e.g., auth.model.ts).
├── routes/         # Express router definitions mapping URLs to Controllers.
├── middleware/     # Custom Express middlewares (e.g., JWT auth, Role/Permission checking).
├── validations/    # Zod schemas for validating incoming request bodies.
├── services/       # Helper classes for external integrations (e.g., mail.service.ts).
├── events/         # RabbitMQ Producers (publishEvent) and Consumers (channel.consume).
└── server.ts       # Application entry point (starts Express and connects to DB/RabbitMQ).
```

---

## 🧠 4. Key Engineering Patterns to Understand

### 🛡️ API Gateway & Circuit Breakers (`opossum`)
The `api-gateway` proxies requests to the microservices. To prevent cascading system failures (e.g., if the `doctor-service` goes down, preventing the gateway from hanging), the Gateway utilizes the **Circuit Breaker pattern** via the `opossum` library. If a service fails too many times, the circuit "trips" and instantly returns a `503 Service Unavailable` response until the service recovers.

### 🐰 RabbitMQ & Dead Letter Queues (DLQ)
We heavily utilize Event-Driven architecture. In the `notification-service/src/events/consumer.ts`, you will find logic handling RabbitMQ queues. 
- **Retry Logic:** If an email fails to send, the consumer catches the error, increments a retry counter in the headers, and sends it to a `notification_retry_queue` where it waits for 30 seconds before trying again.
- **DLQ:** If it fails 3 times, it is sent to a Dead Letter Queue (`notification_dlq`) so it isn't lost, allowing developers to debug the failure later.

### 🔌 WebSockets (`socketio-service`)
Real-time communication is completely decoupled into its own service (`socketio-service`). 
- When a client connects, they join specific "rooms" based on their ID or Role (e.g., `hospital_59`, `role_1` for superadmins, `user_123`).
- When a microservice (like the `notification-service`) needs to send a live alert, it makes an internal HTTP POST to the API Gateway's `/api/emit-event`, which forwards it to the `socketio-service` to broadcast.
- The `socket.io-redis-adapter` is used to ensure sockets work seamlessly across multiple running instances.

### 🔐 Authentication & Cookies
Authentication is handled via JWT.
- **Access Tokens** are short-lived (15 minutes).
- **Refresh Tokens** are long-lived (2 weeks) and are securely set as `HttpOnly`, `Secure`, and `SameSite=None` cookies.
- When an Access Token expires, the frontend calls the API Gateway's `/api/auth/refresh` endpoint. The Gateway forwards the cookie to the `auth-service`, which validates it and returns a new Access Token.

---

## 🚀 5. Local Development Workflow

To run the entire stack locally:
1. Ensure Docker Desktop is running.
2. Ensure you have an `.env` file in the root of **each** microservice (using the correct database and RabbitMQ URIs).
3. Run `docker compose up --build`.

**Important Note on Databases:** In production, the backend connects to an AWS RDS/Neon Postgres database instance. Ensure your local `.env` files point to your local Postgres container or a staging database, depending on your needs.

---

## 🛠️ 6. Technical Debt & Future Improvements (For the Next Developer)
As you settle in, consider tackling these areas to further mature the codebase:
1. **Refactor Fat Controllers:** Currently, `controllers` handle a massive amount of business logic (e.g., `auth.controller.ts`). Consider extracting this logic into dedicated `services/` to make the code more unit-testable.
2. **Shared NPM Package:** There is duplicated code (like Database setup, RabbitMQ connections, and Error handling middlewares) across the 20 services. Creating a shared internal NPM package (e.g., `@hosta/common`) would significantly reduce boilerplate.
3. **Strict TypeScript:** Replace remaining `any` typings with strict TypeScript Interfaces for better autocomplete and compile-time safety.

Best of luck! You are taking over a highly sophisticated, robustly engineered distributed system.
