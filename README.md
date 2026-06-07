# SMS Portal — Angular Frontend

A production-grade Angular 17 frontend for the SMSPortal telemarketer platform.

---

## 🎨 Design System

| Token | Value | Use |
|-------|-------|-----|
| `--bg-base` | `#0a0c10` | Page background |
| `--bg-card` | `#1c2029` | Cards |
| `--accent` | `#00e5ff` | Primary CTAs, active states |
| `--green` | `#00e676` | Success, delivered |
| `--red` | `#ff5252` | Errors, failed |
| `--yellow` | `#ffd740` | Warnings, queued |
| Font heading | `Syne` | Titles |
| Font body | `DM Sans` | Body text |
| Font mono | `Space Mono` | Numbers, codes |

---

## 🏗️ Project Structure

```
src/app/
├── core/
│   ├── guards/         auth.guard.ts, adminGuard, guestGuard
│   ├── interceptors/   auth.interceptor.ts  (JWT auto-attach + 401 redirect)
│   └── services/       auth, sms, wallet, sender-id services
├── features/
│   ├── auth/           login, register (split-screen layout)
│   ├── dashboard/      stats cards, bar chart, quick actions
│   ├── send-sms/       quick SMS + bulk CSV upload
│   ├── reports/        paginated delivery table with filters
│   ├── wallet/         balance, Razorpay recharge, transaction history
│   └── sender-id/      request & list sender IDs
└── shared/
    ├── components/
    │   └── layout/     sidebar + topbar shell
    └── models/         TypeScript interfaces for all API types
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm start
# App runs at http://localhost:4200
# API proxied to http://localhost:8080
```

Make sure the Spring Boot backend is running on port 8080.

### Build for Production

```bash
npm run build
# Output: dist/smsportal-frontend/browser/
```

---

## ⚙️ Configuration

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  razorpayKeyId: 'rzp_test_xxxxxxxx'
};
```

For production, edit `src/environments/environment.prod.ts`.

---

## 📡 API Integration

All HTTP calls go through `HttpClient` with the `authInterceptor` that:
- Automatically attaches `Authorization: Bearer <token>` to every request
- Redirects to `/auth/login` on 401 responses

### Services

| Service | File | Covers |
|---------|------|--------|
| `AuthService` | `core/services/auth.service.ts` | Login, register, JWT storage, logout |
| `SmsService` | `core/services/sms.service.ts` | Send SMS, bulk CSV, reports |
| `ReportService` | `core/services/sms.service.ts` | Dashboard stats |
| `WalletService` | `core/services/wallet.service.ts` | Balance, Razorpay, transactions |
| `SenderIdService` | `core/services/sender-id.service.ts` | Request & list sender IDs |

---

## 🔐 Authentication Flow

```
Login → JWT stored in localStorage
  ↓
authGuard protects all /dashboard, /send-sms, etc.
  ↓
authInterceptor adds Bearer token to every request
  ↓
401 response → auto logout + redirect to /auth/login
```

---

## 💳 Razorpay Integration

The wallet page uses the Razorpay JS SDK (loaded in `index.html`):

1. Click "Pay with Razorpay"
2. Frontend calls `POST /api/wallet/recharge/create-order`
3. Razorpay checkout opens
4. On success, frontend calls `POST /api/wallet/recharge/verify`
5. Backend verifies HMAC signature and credits wallet

---

## 🐳 Docker

```bash
# Build image
docker build -t smsportal-frontend .

# Run standalone (needs backend at port 8080)
docker run -p 4200:80 smsportal-frontend

# Or use the full docker-compose from the backend project
docker-compose up
```

---

## 📱 Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| ≥1200px | Full sidebar + multi-column grids |
| 768–1200px | Collapsed sidebar, 2-col grids |
| <768px | Hidden sidebar (mobile menu), single col |

---

## 🛠️ Tech Stack

| Library | Version | Use |
|---------|---------|-----|
| Angular | 17 | Framework (standalone components) |
| Angular Signals | 17 | Reactive state |
| ngx-toastr | 18 | Toast notifications |
| Razorpay JS SDK | CDN | Payment checkout |
| Angular Material | 17 | Icons only |
| Google Fonts | CDN | Syne, DM Sans, Space Mono |

---

## 🔧 Scripts

```bash
npm start          # Dev server at :4200 with API proxy
npm run build      # Production build
npm test           # Unit tests
```
