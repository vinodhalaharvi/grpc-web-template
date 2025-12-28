# PureCerts UI

A modern React TypeScript dashboard for certificate management, built with:
- **React 18** + **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Connect-RPC** for API communication

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         PureCerts UI                         │
│  React + TypeScript + Tailwind                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   src/                                                       │
│   ├── api/client.ts      # Connect-RPC API client           │
│   ├── hooks/useApi.ts    # React Query hooks                │
│   ├── types/index.ts     # TypeScript types (proto match)   │
│   ├── context/           # Auth context                     │
│   ├── components/        # Shared components                │
│   └── pages/             # Route pages                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│              Connect Protocol (HTTP/JSON)                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Backend Options:                                           │
│   ├── FauxRPC (:6660)     # Mock server for development     │
│   └── Go Server (:8080)   # Real Connect server             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at http://localhost:3000

### Using with FauxRPC (Mock Backend)

FauxRPC provides fake data respecting your proto definitions:

```bash
# Install FauxRPC
go install github.com/sudorandom/fauxrpc/cmd/fauxrpc@latest

# Build proto binary (from your proto directory)
buf build -o purecerts.binpb

# Run FauxRPC
fauxrpc run --schema=purecerts.binpb --addr=:6660

# Dashboard available at http://localhost:6660/fauxrpc
```

### Using with Real Backend

Set the API URL environment variable:

```bash
VITE_API_URL=http://localhost:8080 npm run dev
```

## Project Structure

```
purecerts-ui/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── client.ts          # API client with all service methods
│   ├── components/
│   │   └── Layout.tsx         # App shell with sidebar
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication state
│   ├── hooks/
│   │   └── useApi.ts          # React Query hooks for all services
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Certificates.tsx
│   │   ├── CertificateDetail.tsx
│   │   ├── IssueCertificate.tsx
│   │   ├── CAs.tsx
│   │   ├── CADetail.tsx
│   │   ├── CreateCA.tsx
│   │   ├── Users.tsx
│   │   ├── AuditLogs.tsx
│   │   └── Settings.tsx       # Profile, Security, API Keys, Sessions, Billing
│   ├── types/
│   │   └── index.ts           # TypeScript types matching proto
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Features

### Dashboard
- Certificate overview with status summary
- Usage tracking (certs, CAs, users)
- Recent certificates list
- CA overview cards

### Certificates
- List with filtering by status
- Search functionality
- Bulk actions (renew, revoke)
- Detail view with full certificate info
- Issue new certificates

### Certificate Authorities
- CA list with stats
- Create root/intermediate CAs
- CA detail with certificate counts

### Users
- Team member management
- Role-based access (Owner, Admin, Operator, Viewer)
- Invite new users

### Audit Logs
- Activity timeline
- Filter by action type
- Detailed action info

### Settings
- **Profile**: Personal info, avatar
- **Security**: Password, 2FA
- **API Keys**: Create, manage, revoke
- **Sessions**: View and revoke active sessions
- **Billing**: Plan, usage, invoices
- **Organization**: Tenant settings

## Connecting to Generated Types

After running `buf generate`, replace the types in `src/types/index.ts`:

```typescript
// src/types/index.ts
export * from '../gen/purecerts/v1/purecerts_pb';
```

And update the API client:

```typescript
// src/api/client.ts
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { CertificateService } from "../gen/purecerts/v1/purecerts_connect";

const transport = createConnectTransport({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:6660",
});

export const certificateClient = createClient(CertificateService, transport);
```

## Development

### Available Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run generate  # Run buf generate
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:6660` | Backend API URL |

## Design System

The UI uses a consistent design system:

### Colors
- **Brand**: Indigo/purple gradient (`brand-500` to `brand-700`)
- **Success**: Emerald
- **Warning**: Amber
- **Danger**: Red
- **Neutral**: Slate

### Components
- `.btn` / `.btn-primary` / `.btn-secondary` - Buttons
- `.input` - Form inputs
- `.card` - Content cards
- `.badge` / `.badge-success` - Status badges
- `.table` - Data tables

### Typography
- **Font**: DM Sans (body), JetBrains Mono (code)
- Hierarchical sizing with consistent spacing
