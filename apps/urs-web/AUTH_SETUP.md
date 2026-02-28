# Authentication Setup Guide

This document outlines the authentication setup for the URS (Unit Registry System) web application using NextAuth.js v5 (Auth.js) with Prisma adapter.

## Overview

The authentication system includes:
- **NextAuth.js v5** (Auth.js) for authentication
- **Credentials Provider** for username/password login
- **JWT-based sessions** with role and permission support
- **Edge-compatible middleware** for route protection

## Project Structure

```
apps/urs-web/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   │   │   └── route.ts              # GET and POST handlers
│   │   ├── login/
│   │   │   ├── page.tsx              # Login page UI
│   │   │   └── login-form.tsx        # Login form component
│   │   └── layout.tsx                # Root layout with auth check
│   ├── auth.ts                       # NextAuth configuration (Node.js runtime)
│   ├── auth.config.ts                # Edge-compatible auth config for middleware
│   ├── middleware.ts                 # Route protection middleware (Edge runtime)
│   ├── types/
│   │   └── auth.d.ts                 # TypeScript type extensions
│   └── lib/
│       └── prisma.ts                 # Prisma client singleton
├── scripts/
│   └── seed.ts                       # Seed script for demo user
└── .env.local.example                # Environment variables template
```

## Database Schema Changes

The following models were added/modified in `libs/prisma/urs/src/schema.prisma`:

### Updated `users` Model
- Changed `id` from `Int` to `String` (CUID)
- Made `username` and `password` optional
- Added `emailVerified` field for future email verification support

### New Models (for future OAuth support)
- `accounts` - OAuth account linking (if needed in future)
- `sessions` - Session management (currently using JWT, not DB sessions)
- `verificationtokens` - Email verification tokens

> **Note:** Since we're using JWT-based sessions, database session storage is not required. The session data is stored in an encrypted cookie.

## Environment Variables

Create a `.env.local` file in `apps/urs-web/` with:

```bash
# Database
URS_DATABASE_URL="postgresql://user:password@localhost:5432/investment?schema=public"

# NextAuth
AUTH_SECRET="your-secret-key-here-min-32-characters-long"
NEXTAUTH_URL="http://localhost:4200"
```

> **Note:** `AUTH_SECRET` should be at least 32 characters long. You can generate one with:
> ```bash
> openssl rand -base64 32
> ```

## Setup Instructions

### 1. Set Environment Variables

```bash
cd apps/urs-web
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

### 2. Run Database Migration

```bash
# From the root of the project
cd libs/prisma/urs
npx prisma migrate dev --name add_nextauth_models
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Seed Demo User

```bash
cd apps/urs-web
npx tsx scripts/seed.ts
```

This creates a demo user:
- **Username:** `admin`
- **Password:** `password123`
- **Email:** `admin@example.com`

### 5. Start the Development Server

```bash
# From the root of the project
npx nx serve urs-web
```

## Features

### Login Page
- Clean Untitled UI design
- Username/email and password fields
- Password visibility toggle
- "Remember me" option
- Error handling with user-friendly messages
- Loading states

### Session Management
- JWT-based sessions
- Custom session data including:
  - User ID
  - Username
  - Email
  - Roles
  - Permissions

### Route Protection
- Middleware automatically protects all routes except:
  - `/login` - Login page
  - `/api/auth/*` - Auth API endpoints
  - Static files

### Sign Out
- Integrated in the sidebar account menu
- Redirects to login page after sign out

## Usage

### Accessing Session in Components

```tsx
"use client";
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome {session.user.name}!</p>
      <p>Roles: {session.user.roles.join(", ")}</p>
    </div>
  );
}
```

### Server-Side Session Access

```tsx
import { auth } from "@/auth";

export default async function ServerComponent() {
  const session = await auth();

  if (!session) {
    // Redirect or show unauthorized
  }

  return <div>Welcome {session.user.name}!</div>;
}
```

### Protecting API Routes

```tsx
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle authenticated request
}
```

## Future Enhancements

### OAuth Providers
To add OAuth providers (Google, GitHub, etc.):

1. Install the provider package
2. Add provider configuration in `auth.ts`
3. Add environment variables for client ID and secret
4. Update the login page with OAuth buttons

### Email Verification
To enable email verification:

1. Configure an email provider (SendGrid, AWS SES, etc.)
2. Uncomment email provider in `auth.ts`
3. Implement email sending callback

### Password Reset
To add password reset:

1. Create a password reset request page
2. Implement token generation and email sending
3. Create password reset confirmation page
4. Update the Prisma schema if needed

## Troubleshooting

### "Invalid username or password" Error
- Check that the user exists in the database
- Verify the password hash matches
- Ensure `is_active` is `true` for the user

### Session Not Persisting
- Check `AUTH_SECRET` is set correctly
- Verify `NEXTAUTH_URL` matches your app URL
- Check browser cookies are enabled

### Database Connection Issues
- Verify `URS_DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database permissions

## Security Considerations

1. **Environment Variables:** Never commit `.env.local` to version control
2. **Password Hashing:** Passwords are hashed with bcrypt (10 rounds)
3. **CSRF Protection:** NextAuth.js handles CSRF protection automatically
4. **Session Security:** Use HTTPS in production
5. **Rate Limiting:** Consider adding rate limiting for login attempts
