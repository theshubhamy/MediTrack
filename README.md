# 🏥 MediTrack - Clinic Management SaaS

**Node.js + Express + EJS (Server-Side Rendering)**

A multi-tenant SaaS application for small clinics to manage **patients, doctors, medical visit history, prescriptions, and follow-ups**.

> **One clinic = one account, multiple doctors & staff**

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

The application will be available at http://localhost:3000

**Seed database:**

```bash
docker-compose exec app npm run seed
```

See [DOCKER.md](./DOCKER.md) for complete Docker documentation.

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Build CSS
npm run build:css

# 3. Setup database (update .env first)
npm run db:migrate

# 4. Seed database (optional)
npm run seed

# 5. Start server
npm run dev
```

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

## 🎯 Key Features

- **Clinic & User Management** - One clinic per account, multiple doctors and staff
- **Patient Management** - Central database with search and full history
- **Visit History** - Multiple visits per patient with doctor tracking
- **Digital Prescriptions** - Create, print, and share prescriptions
- **Follow-up Reminders** - Automatic SMS/WhatsApp reminders
- **Role-Based Access** - CLINIC_ADMIN, DOCTOR, STAFF, READ_ONLY roles

See [ROLES.md](./ROLES.md) for role permissions.

---

## 🧱 Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Server-Side Rendering), Tailwind CSS
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** Session-based with bcrypt
- **Cache:** Redis (optional)
- **Jobs:** node-cron for scheduled tasks

---

## 📁 Project Structure

```
src/
├── app.js              # Main application entry
├── config/             # Configuration files
├── routes/             # Express routes
├── middlewares/        # Auth, validation middleware
├── views/              # EJS templates
├── public/             # Static assets (CSS, JS)
├── jobs/               # Scheduled jobs
└── utils/              # Helper functions
```

---

## 🔐 Default Credentials

After seeding the database:

- **CLINIC_ADMIN:** `admin@clinic.com` / `admin123`
- **DOCTOR:** `doctor@clinic.com` / `admin123`
- **STAFF:** `staff@clinic.com` / `admin123`
- **READ_ONLY:** `readonly@clinic.com` / `admin123`

⚠️ **Change these in production!**

---

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Detailed setup guide
- [DOCKER.md](./DOCKER.md) - Docker deployment guide
- [ROLES.md](./ROLES.md) - Role-based access control

---

## 🛠️ Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server
npm run build:css      # Build Tailwind CSS
npm run db:migrate      # Run database migrations
npm run db:migrate:undo # Rollback last migration
npm run seed           # Seed database with test data
npm run setup          # Quick setup (install + build + generate)
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
npm run docker:logs    # View Docker logs
```

---

## 🔒 Security

- Password hashing with bcrypt
- Session-based authentication
- Multi-tenant data isolation
- Input validation
- Role-based access control

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!
