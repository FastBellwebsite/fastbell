# FastBell — Hyperlocal Campus Commerce Frontend

FastBell is an ultra-fast campus commerce web application designed specifically for universities and college campuses. It connects students with campus canteens, stationery stores, grocery hubs, laundry services, and healthcare facilities with role-based interfaces for students, vendors, delivery riders, and administrators.

---

## Key Features

- **Role-Based Portals**:
  - **Student Marketplace**: Fast food ordering, stationery printing requests, groceries, and laundry booking with campus-specific delivery drop-points.
  - **Vendor Portal**: Live incoming order queue, preparation workflow status updates, and catalog/inventory management.
  - **Delivery Portal**: Active delivery route pickups, drop-off confirmations, and real-time transit status updates.
  - **Admin Control Center**: Campus-wide merchant management, catalog auditing, order tracking, and user oversight.
- **Campus Multi-Tenancy**: Built-in support for campus-specific filtering and designated hostel/department delivery spots.
- **Cart & Store Conflict Management**: Intelligent cart isolation preventing multi-vendor checkout conflicts with user confirmation.
- **Instant Reactive Updates**: Synchronized state across multi-tab workflows using event-driven local storage synchronization.
- **Design System**: Lightweight, responsive interface with Dark / Light theme persistence and mobile-optimized layouts.

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with CSS custom properties design tokens

---

## Getting Started

### Prerequisites

- Node.js (version 18.0 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fastbell-frontend.git
   cd fastbell-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional for local mock mode):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## Available Scripts

- `npm run dev`: Launches the local Vite development server with Hot Module Replacement.
- `npm run build`: Compiles TypeScript and builds the optimized production bundle to `/dist`.
- `npm run typecheck`: Validates TypeScript types across the entire project (`tsc --noEmit`).
- `npm run lint`: Runs ESLint to check code quality.
- `npm run preview`: Previews the production build locally.

---

## Authentication

User registration and authentication are handled through the application's role-specific registration and login workflows (`/register/student`, `/register/vendor`, `/register/delivery`, `/login`). A fresh instance starts without pre-seeded accounts.

---

## Project Structure

```text
src/
├── components/       # Shared UI components (Navbar, Footer, ProductCard, StoreCard, etc.)
├── context/          # React contexts (AuthContext, StoreContext, CartContext, OrderContext)
├── data/             # Campus, category, store, and product catalog seed definitions
├── layouts/          # Persistent layouts (StudentLayout, DashboardLayout)
├── pages/            # Application views & role portals
│   ├── admin/        # Admin dashboard, products, vendors, and orders
│   ├── delivery/     # Delivery rider order queue and execution
│   └── vendor/       # Merchant order management and product catalog
├── selectors/        # Data filtering, search, and recommendation selectors
├── services/         # State management and mock API services (ready for REST connection)
├── types.ts          # Core domain TypeScript interfaces and schemas
└── utils/            # Location calculation, image fallbacks, and order flow helpers
```

---

## Backend Integration Architecture

FastBell frontend is structured to enable direct transition from client-side mock services to a RESTful or GraphQL backend:

- Authentication services located in [`src/services/mockAuthService.ts`](src/services/mockAuthService.ts) map to `/api/auth/*`.
- Store and catalog services in [`src/services/mockStoreService.ts`](src/services/mockStoreService.ts) and [`src/services/mockProductService.ts`](src/services/mockProductService.ts) map to `/api/stores/*` and `/api/products/*`.
- Order lifecycle and placement in [`src/services/mockOrderService.ts`](src/services/mockOrderService.ts) map to `/api/orders/*`.
