# StraddleTrader (Stoxkart Algo Trading Platform)

This is a single-client trading platform designed for Stoxkart broker integration.

## Project Structure
- **/frontend**: Next.js 14+ (App Router) + Tailwind CSS + Lucide Icons
- **/backend**: Express + TypeScript + MongoDB + Mongoose

## Key Features
- **Stoxkart Integration**: Full OAuth2-style login flow with HMAC-SHA256 signature.
- **ATM Straddle Strategy**: Automatically identifies ATM strike, fetches NFO tokens, and places market orders for CE and PE legs.
- **Scrip Master**: Background downloading of NFO instrument lists for precise token mapping.
- **Dashboard**: Live P&L monitoring, positions, and order book.
- **Security**: AES-256 encryption for API Secret and Access Tokens.

## Setup Instructions

### Backend
1. Go to `/backend`.
2. Install dependencies: `npm install`.
3. Create `.env` file (template provided in `/backend/.env`).
4. Run seed script to create initial user: `npx ts-node src/scripts/seed.ts`.
5. Start server: `npm run dev`.

### Frontend
1. Go to `/frontend`.
2. Install dependencies: `npm install`.
3. Create `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000`.
4. Start development server: `npm run dev`.

## Trading Logic
- The **Strategy Engine** (`engine.service.ts`) runs every minute during market hours via `node-cron`.
- It monitors active strategies and executes **Entry** based on the configured time.
- It calculates the **ATM Strike** using live index price (NIFTY50) and NFO strike steps (50 points).
- It places **Market Orders** for both Call and Put legs simultaneously.

---

**Disclaimer**: This software is for educational purposes. Algorithmic trading involves high risk of capital loss. Always test in pre-prod/paper mode first.
