# Microfinance Loan Management System (MLMS)

## Overview

A comprehensive microfinance loan management system designed for Pakistani Microfinance Institutions (MFIs). The application provides end-to-end functionality for client onboarding with AI-powered risk assessment, loan application processing with automated repayment schedule generation, payment tracking with default prediction, and comprehensive analytics dashboards.

The system implements a hybrid risk scoring approach combining rule-based logic with machine learning to evaluate client creditworthiness and provide intelligent loan recommendations. It features real-time overdue detection, default risk alerts, and visual analytics for portfolio management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Framework:**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- Inter font family for professional typography
- JetBrains Mono for monospaced data (CNIC, amounts)

**Design System:**
- Component-based architecture with reusable UI primitives
- Custom color palette supporting light/dark modes via CSS variables
- Consistent spacing scale (2, 4, 6, 8, 12, 16 units)
- Card-based layouts with responsive grid systems
- Professional, data-dense interface optimized for financial applications

**State Management:**
- JWT token stored in localStorage for authentication persistence
- React Query for all API interactions with automatic caching and invalidation
- React Hook Form with Zod schema validation for form state
- No global state management library (Context/Redux) - leveraging React Query cache

**Key Frontend Patterns:**
- Protected route wrapper checking authentication status
- Centralized API client with bearer token injection
- Form validation using Zod schemas shared with backend
- Optimistic UI updates with automatic query invalidation
- Reusable badge components for risk levels and payment statuses

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- REST API architecture with clear endpoint separation
- JWT-based stateless authentication

**API Structure:**
- `/api/auth/*` - Authentication endpoints (login)
- `/api/clients/*` - Client CRUD and risk profiling
- `/api/loans/*` - Loan creation and retrieval with installments
- `/api/installments/*` - Payment recording and status updates
- `/api/dashboard/*` - Aggregated analytics and statistics

**Business Logic Patterns:**
- ML-based risk scoring engine combining rules and lightweight prediction
- Automatic repayment schedule generation with 15% flat profit rate
- Default risk detection based on consecutive overdue installments
- Loan amount recommendations tiered by client risk level (Low: 300k, Medium: 150k, High: 50k PKR)

**Security:**
- bcryptjs for password hashing (10 salt rounds)
- JWT tokens with 7-day expiration
- Authentication middleware protecting all routes except login
- Bearer token validation on every protected request

**Data Patterns:**
- In-memory storage implementation (MemStorage class)
- UUID-based entity identifiers
- Shared TypeScript schemas between client and server
- Comprehensive TypeScript interfaces for type safety across API boundaries

### Database Layer

**ORM & Schema:**
- Drizzle ORM with PostgreSQL dialect
- Schema defined in shared TypeScript for full-stack type safety
- Alembic-style migrations stored in `/migrations` directory

**Database Tables:**
- `users` - Loan officer accounts with hashed passwords
- `clients` - Customer records with risk scoring (CNIC, income, employment, risk level)
- `loans` - Loan agreements with calculated totals and monthly installments
- `installments` - Individual payment records with due dates and payment status

**Current Implementation:**
- Application uses in-memory storage (Map-based) during development
- Schema configured for PostgreSQL via Drizzle with connection via environment variable
- Production deployment expects `DATABASE_URL` environment variable
- Neon serverless PostgreSQL driver included in dependencies

**Data Relationships:**
- Clients → Loans (one-to-many)
- Loans → Installments (one-to-many)
- All foreign keys enforced at schema level

### Machine Learning Integration

**Risk Scoring Model:**
- Hybrid approach: rule-based scoring + simple Random Forest classifier
- Synthetic training data generation (200 samples) embedded in application
- Base rules: Low income (<30k) +2 points, Existing loans +2 points, Unemployed +3 points
- K-nearest neighbors prediction (k=5) for final risk classification
- Output: Numeric score (0-10) mapped to Low/Medium/High risk levels

**Default Prediction:**
- Rule-based logic: 2+ consecutive overdue installments OR initial high risk = default risk
- Real-time calculation on loan detail pages
- Alert banners displayed for high-risk loans

## External Dependencies

**UI Component Libraries:**
- @radix-ui/* - Headless accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Recharts - Declarative charting library for dashboard visualizations
- lucide-react - Icon system for consistent visual language
- cmdk - Command palette component
- vaul - Drawer component for mobile interactions

**Form & Validation:**
- react-hook-form - Performant form state management
- @hookform/resolvers - Integration layer for Zod validation
- zod - Runtime schema validation shared between frontend and backend
- drizzle-zod - Automatic Zod schema generation from Drizzle tables

**Database & ORM:**
- @neondatabase/serverless - Serverless PostgreSQL driver for Neon
- drizzle-orm - TypeScript ORM with SQL-like query builder
- drizzle-kit - CLI tool for migrations and schema management

**Authentication:**
- jsonwebtoken - JWT creation and verification
- bcryptjs - Password hashing and comparison

**Build Tools:**
- Vite - Frontend bundler with HMR
- esbuild - Backend bundling for production
- TypeScript compiler for type checking
- Tailwind CSS with PostCSS and Autoprefixer



**Date Handling:**
- date-fns - Modern date utility library for formatting and calculations