# kodcart frontend

A React and Vite frontend for **kodcart**, an e-commerce application for browsing products, managing a shopping cart, placing orders, and administering the product catalog.

The frontend works with the [kodcart backend](https://github.com/chandan2909/kodcart-backend), a Spring Boot REST API backed by MySQL and Razorpay.

## Features

- Customer registration, login, logout, and protected routes
- Product browsing with category filters and product cards
- Cart management with quantity updates, removal, totals, and shipping calculation
- Razorpay checkout integration with backend payment verification
- Order history and customer profile pages
- Role-based admin dashboard and product management
- API services for authentication, products, cart, orders, payments, and admin operations
- Automated component and service tests with Vitest and Testing Library

## Tech stack

- React 19
- React Router 7
- Vite 8
- JavaScript (ES modules)
- Vitest and Testing Library
- Oxlint

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- The kodcart Spring Boot backend running locally

### Installation

```bash
npm install
cp .env.example .env
npm run dev
```

The development server is available at [http://localhost:5173](http://localhost:5173).

### Environment variables

Create a `.env` file from `.env.example`:

```env
VITE_API_URL=http://localhost:9090
VITE_RAZORPAY_KEY_ID=your_razorpay_test_key
```

`VITE_API_URL` points to the backend API. The backend runs on port 9090 by default; see the [backend README](https://github.com/chandan2909/kodcart-backend#running-the-application) for database and server setup. Start the backend before testing authenticated, cart, order, admin, or checkout flows. `VITE_RAZORPAY_KEY_ID` is the public Razorpay key used by the browser; payment secrets must remain in the backend.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Application routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Sign in |
| `/register` | Public | Create an account |
| `/` | Authenticated | Customer dashboard or admin dashboard |
| `/cart` | Customer | Review and manage the cart |
| `/orders` | Customer | View orders |
| `/profile` | Authenticated | View profile information |
| `/admin` | Admin | View business and administration dashboard |
| `/admin/products` | Admin | Manage products |

## Project structure

```text
src/
├── components/   Shared UI components
├── context/      Authentication and cart state providers
├── data/         Product and pricing data
├── hooks/        Reusable React hooks
├── pages/        Customer and admin screens
├── services/     Backend API and payment integrations
└── test/         Shared test setup and utilities
```

## Backend integration

The frontend sends authenticated requests with credentials enabled so the backend `httpOnly` authentication cookie is included. The backend is expected to provide the authentication, product, cart, order, admin, and payment endpoints consumed by the service modules in `src/services/`.

For local development, confirm that the backend CORS configuration allows the Vite development origin and that the backend is running before testing authenticated or checkout flows.

## Testing

Run the complete test suite with:

```bash
npm test
```

Tests cover routing, authentication, cart behavior, shared components, pages, API services, and payment/order integrations.

## License

This project is maintained as part of the kodcart application.