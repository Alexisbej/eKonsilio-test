# eKonsilio Project

This monorepo contains a comprehensive solution built with modern technologies to provide a robust platform for visitor chat and authentication services.

## Project Overview

eKonsilio is a multi-application platform built using a monorepo architecture with Turborepo. The project consists of several applications and shared packages that work together to provide a seamless experience.

### Applications

- Backend : A NestJS application that handles authentication, user management, and API services
- Visitor-Chat : A frontend application for visitor chat functionality
- Admin : An administration interface for managing the platform

### Packages

- @repo/ui : Shared React component library
- @repo/types : TypeScript type definitions shared across applications
- @repo/utils : Common utility functions

## Technology Stack

### Backend

- NestJS : A progressive Node.js framework for building efficient and scalable server-side applications
- Passport.js : Authentication middleware for Node.js
- JWT : JSON Web Tokens for secure authentication
- TypeScript : For type safety and better developer experience

### Frontend

- React : For building user interfaces
- Next.js : React framework for production-grade applications

### DevOps & Infrastructure

- Docker : Containerization for consistent development and deployment environments
- Turborepo : Build system for JavaScript/TypeScript monorepos

## Architecture Decisions

### Monorepo Structure

The decision to use a monorepo architecture with Turborepo provides several advantages:

1. Code Sharing : Shared packages like UI components, types, and utilities can be easily maintained and updated
2. Consistent Development Experience : Common configurations for TypeScript, ESLint, and other tools
3. Efficient Builds : Turborepo's caching capabilities significantly improve build times

### Authentication System

The authentication system in the backend application supports multiple strategies:

1. Google OAuth : For social login capabilities
2. JWT : For secure API access
3. Visitor Sessions : For anonymous users who need limited access
   This flexible approach allows for different levels of authentication based on user needs.

### API Design

The backend API follows RESTful principles with controllers organized by domain:

- Auth Controller : Handles authentication flows including Google OAuth, JWT validation, and visitor sessions
- Profile Management : User profile retrieval and management

## Getting Started

### Prerequisites

- Node.js (>=18)
- pnpm (9.0.0 or higher)
- Docker and Docker Compose (for local development)

```
git clone <repository-url>

# Navigate to the project directory

cd ekonsilio-test

# Install dependencies

pnpm install
```

```
# Start all applications in development mode
pnpm dev

# Build all applications
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm check-types
```

```
# Start all services
docker-compose up
```
