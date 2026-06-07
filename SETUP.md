# SMS Portal — Full-Stack Setup Guide

Complete guide to run the **Angular + Spring Boot SMS Portal** locally or in production.

---

## 📁 Project Layout

```
smsportal-backend/          ← Spring Boot 3 + MySQL + Redis + RabbitMQ
smsportal-frontend/         ← Angular 17 standalone components
  docker-compose.fullstack.yml  ← Runs everything together
```

---

## ⚡ Quickest Start (Docker)

Rename your folders and run:

```bash
# 1. Rename backend folder (must match docker-compose)
mv smsportal  smsportal-backend

# 2. From the smsportal-frontend folder:
docker-compose -f docker-compose.fullstack.yml up --build

# App is live at:
#   Frontend  →  http://localhost
#   Backend   →  http://localhost:8080
#   RabbitMQ  →  http://localhost:15672  (guest / guest)
```

---

## 🛠️ Manual Local Development

### Step 1 — Start infrastructure

```bash
# MySQL (Docker)
docker run -d --name sms-mysql -e MYSQL_ROOT_PASSWORD=yourpassword \
  -e MYSQL_DATABASE=smsportal -p 3306:3306 mysql:8.0

# Redis
docker run -d --name sms-redis -p 6379:6379 redis:7-alpine

# RabbitMQ
docker run -d --name sms-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### Step 2 — Run Spring Boot backend

```bash
cd smsportal-backend

# Edit src/main/resources/application.yml:
#   spring.datasource.password  → yourpassword
#   msg91.auth-key              → your MSG91 key
#   razorpay.key-id             → your Razorpay key
#   razorpay.key-secret         → your Razorpay secret

mvn spring-boot:run
# API starts at http://localhost:8080
```

### Step 3 — Run Angular frontend

```bash
cd smsportal-frontend
npm install
npm start
# App at http://localhost:4200
# Proxies /api → http://localhost:8080 automatically
```

---

## 🔑 First-Time Configuration

### Backend (`application.yml`)

| Setting | Where to get it |
|---------|----------------|
| `msg91.auth-key` | https://msg91.com → API Keys |
| `razorpay.key-id` & `key-secret` | https://dashboard.razorpay.com → Settings → API Keys |
| `jwt.secret` | Generate: `openssl rand -hex 32` |
| `spring.mail.*` | Gmail App Password (enable 2FA first) |

### Frontend (`environment.ts`)

| Setting | Value |
|---------|-------|
| `apiUrl` | `http://localhost:8080/api` (dev) |
| `razorpayKeyId` | Same as backend `razorpay.key-id` |

---

## 👤 Creating Your First Admin User

After registering normally via the UI, update the role in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Then log out and log back in. The **Admin Panel** link will appear in the sidebar.

---

## 🗺️ Feature Map

| Page | Route | What it does |
|------|-------|-------------|
| Login | `/auth/login` | JWT auth |
| Register | `/auth/register` | Create account + wallet |
| Dashboard | `/dashboard` | Stats, 7-day chart, quick actions |
| Send SMS | `/send-sms` | Quick SMS + Bulk CSV upload |
| Reports | `/reports` | Paginated delivery logs, status filter |
| Wallet | `/wallet` | Balance, Razorpay recharge, txn history |
| Sender IDs | `/sender-ids` | Request & track sender ID approval |
| Admin | `/admin` | Users, sender ID approval, SMS logs |

---

## 🔌 API Quick Reference

```
POST /api/auth/register       Register
POST /api/auth/login          Login → JWT
POST /api/sms/send            Send SMS (JSON body)
POST /api/sms/send-bulk-csv   Send bulk via file upload
GET  /api/sms/reports         Paginated delivery reports
GET  /api/reports/dashboard   Dashboard stats
GET  /api/wallet              Get balance
POST /api/wallet/recharge/create-order   Razorpay order
POST /api/wallet/recharge/verify         Verify & credit
GET  /api/wallet/transactions  Transaction history
GET  /api/sender-ids           My sender IDs
POST /api/sender-ids/request   Request new sender ID
GET  /api/admin/stats          Platform stats (ADMIN)
GET  /api/admin/users          All users (ADMIN)
```

All protected endpoints require: `Authorization: Bearer <jwt>`

---

## 📊 SMS Gateway Setup

### MSG91 (Recommended for India)

1. Sign up at https://msg91.com
2. Get your **Auth Key** from the API section
3. Set `msg91.auth-key` in `application.yml`
4. Register a sender ID on the MSG91 dashboard
5. Set `msg91.sender-id` to your approved ID

### Testing Without a Gateway

Change `app.gateway: mock` in `application.yml` to use the mock
gateway that logs SMS to console without calling any external API.

---

## 🚀 Production Checklist

- [ ] Set `jwt.secret` to a strong 256-bit key
- [ ] Set `spring.jpa.hibernate.ddl-auto: validate` (not `update`)
- [ ] Enable HTTPS (Let's Encrypt / Nginx SSL)
- [ ] Switch Razorpay keys to live mode
- [ ] Configure a real SMTP server for email
- [ ] Set `app.cors-origins` to your production domain
- [ ] Set `environment.prod.ts` `apiUrl` to your API domain
- [ ] Run `ng build --configuration production`
- [ ] Set up log rotation and monitoring (Actuator + Prometheus)

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error | Check `app.cors-origins` in `application.yml` |
| 401 on all requests | JWT expired — log out and log back in |
| SMS not sending | Check MSG91 auth key and sender ID approval |
| Razorpay payment fails | Verify key-id matches between backend and frontend |
| RabbitMQ connection refused | Make sure RabbitMQ is running on port 5672 |
| MySQL connection refused | Check password in `application.yml` |
