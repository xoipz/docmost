# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Docmost is an open-source collaborative wiki and documentation software with real-time editing capabilities. It's built with a modern stack featuring:
- **Frontend**: React + TypeScript + Vite + Mantine UI
- **Backend**: NestJS + TypeScript + Fastify
- **Database**: PostgreSQL with Kysely ORM
- **Real-time**: Socket.io + Hocuspocus collaboration server
- **Editor**: TipTap with collaborative features

## Architecture
The project follows a monorepo structure with:
- `apps/client/` - React frontend application
- `apps/server/` - NestJS backend API and WebSocket server
- `packages/` - Shared packages and utilities

### Key Components
- **Collaboration Server**: Separate Hocuspocus server for real-time document editing
- **Database Layer**: Kysely ORM with migration system
- **Authentication**: JWT-based with support for SSO (Google, SAML, OIDC)
- **File Storage**: Supports both local and S3-compatible storage
- **Queue System**: BullMQ for background job processing

## Development Commands

### Root Level
```bash
# Install dependencies
pnpm install

# Start full development environment
pnpm dev

# Build all applications
pnpm build

# Start production server
pnpm start

# Start collaboration server
pnpm collab
```

### Client (Frontend)
```bash
# Development server
pnpm client:dev

# Build for production
pnpm client:build

# Lint code
nx run client:lint

# Format code
nx run client:format
```

### Server (Backend)
```bash
# Development server
pnpm server:dev

# Build for production
pnpm server:build

# Start production server
pnpm server:start

# Run tests
nx run server:test

# Run e2e tests
nx run server:test:e2e

# Lint code
nx run server:lint

# Format code
nx run server:format
```

### Database Migrations
```bash
# Run all pending migrations
pnpm --filter ./apps/server migration:latest

# Create new migration
pnpm --filter ./apps/server migration:create

# Rollback migration
pnpm --filter ./apps/server migration:down

# Generate Kysely types from database
pnpm --filter ./apps/server migration:codegen
```

## Key Architecture Details

### Frontend Structure
- **State Management**: Jotai atoms for global state
- **Routing**: React Router v7
- **API**: TanStack Query for server state management
- **UI Components**: Mantine v7 component library
- **Editor**: TipTap with collaborative extensions

### Backend Structure
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL with Kysely query builder
- **Authentication**: Passport.js with JWT strategy
- **Real-time**: Socket.io for general WebSocket communication
- **Collaboration**: Hocuspocus server for document collaboration
- **Queue**: BullMQ for background processing

### Enterprise Features
Enterprise features are located in `ee/` directories and require an enterprise license:
- `apps/server/src/ee/` - Server-side enterprise features
- `apps/client/src/ee/` - Client-side enterprise features

## Testing
- **Server**: Jest for unit and integration tests
- **Client**: Uses Vite's built-in testing capabilities
- **E2E**: Jest with Supertest for API testing

## Environment Setup
The application requires:
- Node.js 18+
- PostgreSQL database
- Redis (for collaboration and caching)
- Environment variables (see .env.example)

## Package Management
- Uses pnpm workspaces
- Monorepo managed with Nx
- Specific patch for `react-arborist@3.4.0`