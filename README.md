# Ecommerce Store - Project Foundation

## Project Overview
This is a modern ecommerce web application for a startup selling purses and handbags. It features a complete customer journey with a secure, backend-driven checkout, designed to support a future mobile application.

## Architecture
- **Frontend:** Next.js (App Router, Tailwind CSS, TypeScript) -> Port `3000`
- **Backend:** Node.js (Express, REST API) -> Port `5000`
- **Database:** MongoDB (Mongoose)

```text
Next.js
   ↓
Express API
   ↓
MongoDB
```

## Local Requirements
- Node.js (v18+)
- npm
- MongoDB (Running locally or via Atlas)
- Git

## Environment Variables
- `server/.env` must contain `PORT` and `MONGODB_URI`. Never commit real secrets.
- `client/.env.local` must contain `NEXT_PUBLIC_API_BASE_URL`.

## Running Locally

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

## Current Status
This project is currently in the **Foundation Stage (Day 1)**. 
- ✅ Basic Express API & Next.js frontend are running.
- ✅ MongoDB connection is established.
- ❌ No models, authentication, checkout, or products are implemented yet.
