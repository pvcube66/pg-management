# PG Management System

A production-ready PG Management System built with the Next.js 15 App Router, MongoDB, and Tailwind CSS.

## Features

- **Role-Based Access Control**: Superadmin, PG Owner, and Incharge roles.
- **Dashboard**: Specialized dashboards for each role.
- **PG Management**: Dynamic management of floors and rooms.
- **Visual Analytics**: Occupancy charts and stats.
- **Authentication**: NextAuth.js with Credentials and Google provider support.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS, shadcn/ui patterns, Lucide Icons
- **State/Query**: TanStack Query
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install --legacy-peer-deps
    ```
    *(Note: `--legacy-peer-deps` is required due to peer dependency conflicts between Next.js 15 RC and current NextAuth versions)*

3.  Set up environment variables:
    Copy `.env.example` to `.env` and fill in your details.
    ```env
    MONGODB_URI=mongodb://localhost:27017/pg-management
    NEXTAUTH_SECRET=your-secret-key
    NEXTAUTH_URL=http://localhost:3000
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  **Seed the Database**:
    To create the initial Superadmin and sample data, visit this API route in your browser or via curl:
    `http://localhost:3000/api/seed`

    This will create:
    - **Superadmin**: admin@pg.com / admin123
    - **PG Owner**: owner@pg.com / owner123
    - **Incharge**: incharge@pg.com / incharge123
    - **Sample PG**: Sunrise Residency

### Docker

Build and run using Docker:

```bash
docker build -t pg-management .
docker run -p 3000:3000 --env-file .env pg-management
```

## Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components and AuthGuard.
- `/lib`: Database connection, Auth configuration, and utilities.
- `/models`: Mongoose schemas.
- `/public`: Static assets.

## Usage Guide

1.  **Login**: Use the seeded credentials to log in.
2.  **Superadmin**: Create new Owners. View all PGs.
3.  **PG Owner**: Create new PGs. Assign Incharges. Manage your PGs.
4.  **Incharge**: Manage the day-to-day of the assigned PG (Room allocation, etc).
