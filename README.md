# KIOS Chat

A full-stack AI Chat SaaS application built with Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL, Better Auth, and OpenRouter API.

## Features
- **Authentication**: Email/Password, Google, and GitHub OAuth using Better Auth.
- **AI Chat**: Multi-model streaming chat powered by OpenRouter (GPT-4o, Claude 3.5 Sonnet, Gemini, Llama 3).
- **File Attachments**: Cloudinary integration for image and document uploads within threads.
- **Subscriptions**: Stripe integration for one-time thread quota purchases.
- **Admin Dashboard**: Role-Based Access Control (RBAC) to manage usage, agent system prompts, and view historical purchases.
- **Dynamic UI**: Built with Tailwind CSS, shadcn/ui, and Framer Motion.

## ASCII Architecture Flow

```
                      +------------------+
                      |   Client (Web)   |
                      +---------+--------+
                                |
                                v
                      +------------------+
                      |  Next.js 16 App  |
                      |   (App Router)   |
                      +---------+--------+
                                |
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
+------------------+  +------------------+  +------------------+
|   Better Auth    |  |   OpenRouter API |  |   Stripe  API    |
|   (Auth & DB)    |  |   (AI Streaming) |  |   (Payments)     |
+------------------+  +------------------+  +------------------+
          |                                           |
          |       +-------------------------+         | Webhook
          +-----> |     PostgreSQL DB       | <-------+
                  |  (Prisma ORM Managed)   |
                  +-------------------------+
```

## Prerequisites
- **Node.js**: v18.17+
- **PostgreSQL**: A running Postgres database instance (e.g., Supabase, Neon).
- **OpenRouter Account**: For API key access.
- **Stripe Account**: For payment processing and webhooks.
- **Cloudinary Account**: For file hosting.
- **OAuth Credentials**: (Optional) Google and GitHub for social login.

## Step-by-step Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd KIOS-Chat
   bun install
   ```

2. **Environment Configuration**
   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your actual API keys in `.env.local`.

3. **Database Setup**
   Ensure Docker is running, then spin up the PostgreSQL database container:
   ```bash
   docker-compose up -d
   ```
   
   Next, run Prisma migrations to initialize your schema and seed the database with default accounts:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

   **Default Accounts Created:**
   - Admin: `root@email.com` / `12345678`
   - User: `user@email.com` / `12345678`

4. **Run the Development Server**
   ```bash
   bun run dev
   ```
   Access the app at `http://localhost:3000`.

## Stripe Webhook Local Testing

To test Stripe checkout sessions locally, use the Stripe CLI to forward webhook events to your localhost server:

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to the local API endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note the Webhook Secret provided in the terminal output and paste it into your .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## Business Logic & Constraints

### Thread Quota System
By default, new users receive **3 free threads** upon registration. 
Creating a new thread consumes exactly `1` credit. When a user runs out of threads, the "New Thread" button triggers a "Quota Exhausted" dialog, preventing the creation of new threads. The user can navigate to `/dashboard` to purchase more threads via Stripe. Upon a successful `checkout.session.completed` webhook event securely verified from Stripe, the user's `threadsRemaining` quota is atomically incremented, instantly unlocking the ability to create more threads without session refresh.

### Agent Prompt Configuration
Admin users (users with the `admin` role) possess the ability to customize the application's global **System Prompt** inside the `Agent Settings` tab of the Admin Dashboard. This data is saved directly to the database via Next.js Server Actions and securely attached to the *user record*. During chat invocation in `src/app/api/chat/route.ts`, this prompt is fetched dynamically and prepended with the `system` role to the OpenRouter payload. This forces the LLM to strictly adhere to the persona crafted by the Admin.
