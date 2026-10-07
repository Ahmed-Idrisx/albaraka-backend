# Albaraka Backend API

A robust backend service for the Albaraka fresh produce and grocery commerce platform. Built with Node.js, TypeScript, Express, and MongoDB, this API powers product catalog management, admin operations, customer authentication, order workflows, delivery-area logic, and push notifications.

## Overview

The Albaraka backend provides the core business logic and data layer for a modern commerce experience. It is designed to support storefront operations while keeping the architecture clean, secure, and easy to extend.

This service includes:

- Secure authentication and role-based admin access
- Catalog management for products and categories
- Delivery-area configuration and restriction logic
- Shopping cart flows and order management
- Push notification support for order updates
- Image upload integration with ImageKit
- Environment-driven configuration for development and production deployments

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| Database | MongoDB with Mongoose |
| Validation | Zod |
| Auth | JWT + HTTP-only cookies |
| Media | ImageKit |
| Notifications | Web Push API |
| Security | CORS, bcrypt, JWT secrets, environment validation |

## Project Structure

```text
albaraka-backend/
├── src/
│   ├── app.ts                  # Application bootstrap
│   ├── config/                 # DB, env, ImageKit, web-push config
│   ├── controllers/            # Request handlers
│   ├── middlewares/            # Auth, upload, and error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic
│   ├── scripts/                # Operational scripts
│   ├── types/                  # Shared types
│   └── utils/                  # Helpers and utility functions
├── .env.example                # Environment template
├── package.json                # Scripts and dependencies
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Project documentation
└── dist/                       # Production build output
```

## Key Features

### Authentication and Authorization

- Admin login and session management via JWT
- Protected routes using middleware-based authorization
- Role-based access control for superadmin operations
- Secure cookie-based session handling

### Product and Catalog Management

- Product listing and detail retrieval
- Category-based organization
- Product image upload support
- Availability and stock-aware product state
- Home section data for storefront features

### Commerce Workflows

- Cart management endpoints
- Order creation and tracking logic
- Delivery-area validation for fulfillment rules
- Store settings configuration for business rules

### Admin Operations

- Admin account management
- Store settings management
- Product and catalog updates
- Operational scripts for bootstrapping the first admin user

## Prerequisites

Before running the project, ensure you have:

- Node.js 20+ recommended
- MongoDB running locally or in a cloud instance
- A configured ImageKit account for image uploads
- Web Push credentials for browser notifications (optional but recommended)

## Installation

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
copy .env.example .env
```

4. Update the values in `.env` with your configuration.
5. Start MongoDB.
6. Seed the first superadmin user:

```bash
npm run seed:superadmin
```

## Environment Variables

The application reads configuration from `.env` and validates it at startup. The following variables are required:

| Variable | Description |
| --- | --- |
| `PORT` | Port where the API listens, e.g. `5000` |
| `NODE_ENV` | Runtime mode: `development`, `test`, or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `30d` |
| `SUPERADMIN_NAME` | Initial superadmin display name |
| `SUPERADMIN_EMAIL` | Initial superadmin email |
| `SUPERADMIN_PASSWORD` | Initial superadmin password (minimum 8 characters) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public API key |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private API key |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |
| `VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `VAPID_SUBJECT` | Contact URL for notifications |

## Available Scripts

```bash
npm run dev
```
Runs the API in development mode with TypeScript file watching.

```bash
npm run build
```
Compiles the TypeScript source into the `dist` folder.

```bash
npm run seed:superadmin
```
Creates the initial superadmin account from the environment values.

```bash
npm run lint
```
Runs ESLint across the codebase.

## Running the Application

### Development

```bash
npm run dev
```

The API starts in watch mode and listens on the configured `PORT`.

### Production Build

```bash
npm run build
node dist/app.js
```

## API Overview

The application exposes a modular REST API grouped by business domain.

### Core Endpoints

- `GET /health` — service health check
- `POST /api/auth/login` — admin login
- `POST /api/auth/logout` — logout current session
- `GET /api/auth/me` — fetch authenticated user details
- `GET /api/products` — list products
- `GET /api/products/:id` — retrieve a product by ID
- `GET /api/products/slug/:slug` — retrieve a product by slug
- `GET /api/products/home` — fetch homepage-related product data
- `GET /api/categories` — list categories
- `GET /api/delivery-areas` — list delivery areas
- `GET /api/orders` — view orders (protected)
- `GET /api/cart` — cart access (protected)

Admin-protected routes are available for:

- creating and updating products
- creating and managing admins
- modifying settings
- managing order and storefront configuration

## Security Notes

This backend follows a secure-by-default pattern:

- JWTs are used for authenticated access
- Cookies are configured for secure session handling
- HTTP origin restrictions are enforced via CORS
- Passwords are hashed with `bcryptjs`
- Runtime environment variables are validated using `zod`
- Image uploads and push notifications are externalized to managed services

## Deployment Guidance

For deployment, use a production-ready environment with:

- a managed MongoDB instance
- protected environment variables
- a valid `CORS_ORIGIN`
- a secure `JWT_SECRET`
- valid ImageKit and VAPID credentials
- reverse proxy or load balancer in front of the Node process if required

## License

This project is licensed under the ISC license.

## Maintainer

Developed and maintained by Ahmed Idris.

---

If you need a version tailored for GitHub, a more minimal project summary, or a production-ready enterprise style README, this structure can be adapted quickly.
