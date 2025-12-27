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

The application will be available at http://localhost:3301

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
- **Role-Based Access** - CLINIC_ADMIN, DOCTOR, STAFF roles

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

⚠️ **Change these in production!**

---

## 📚 Documentation

# 🐳 Docker Guide

Complete Docker setup for MediTrack application.

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Application: http://localhost:3301

## Services

- **PostgreSQL** - Port 5432 (User: `meditrack`, Password: `meditrack_password`)
- **Redis** - Port 6379 (Password: `redis_password`)
- **Application** - Port 3301

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild
docker-compose up -d --build

# Seed database
docker-compose exec app npm run seed

# Run migrations manually
docker-compose exec app npx sequelize-cli db:migrate

# Access database
docker-compose exec postgres psql -U meditrack -d meditrack

# Access Redis
docker-compose exec redis redis-cli -a redis_password
```

## Development Mode

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This enables hot reload with source code mounting.

## Environment Variables

Create `.env` file:

```env
SESSION_SECRET=your-secret-key
```

Default credentials in `docker-compose.yml`:

- Database: `meditrack` / `meditrack_password`
- Redis: `redis_password`

## Production Deployment

### Build Image

```bash
docker build -t meditrack:latest .
docker tag meditrack:latest your-registry/meditrack:latest
docker push your-registry/meditrack:latest
```

### Production Checklist

- [ ] Change default database passwords
- [ ] Change default Redis password
- [ ] Use strong SESSION_SECRET
- [ ] Enable SSL/TLS
- [ ] Use secrets management
- [ ] Set up proper firewall rules

## Troubleshooting

### Container Won't Start

```bash
docker-compose logs app
docker-compose exec postgres pg_isready -U meditrack
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d --build
```

### Permission Issues

```bash
docker-compose exec app chown -R nodejs:nodejs /app/uploads
```

---

# 🔐 Role-Based Access Control

This document explains the role-based login and access control system in MediTrack.

## Roles Overview

The system supports four user roles with different permissions:

### 1. CLINIC_ADMIN 👑

**Full access to all clinic features**

- ✅ View all patients, visits, and doctors
- ✅ Create and manage patients
- ✅ Create and manage visits
- ✅ Invite and manage doctors
- ✅ Access clinic settings and billing
- ✅ View all statistics and reports

**Navigation Access:**

- Dashboard
- Patients
- Doctors
- Settings

---

### 2. DOCTOR 👨‍⚕️

**Access to patient care features**

- ✅ View all patients
- ✅ Create and manage visits (assigned to them)
- ✅ View only their own visits
- ❌ Cannot manage doctors
- ❌ Cannot access settings/billing
- ❌ Cannot invite other doctors

**Navigation Access:**

- Dashboard (shows only their visits)
- Patients
- Doctors (view only)

**Dashboard Data:**

- Total patients (all clinic patients)
- My visits (only visits assigned to this doctor)
- Recent visits (only their visits)

---

### 3. STAFF 👤

**Access to patient management features**

- ✅ View all patients and visits
- ✅ Create and manage patients
- ✅ Create and manage visits
- ✅ View all doctors
- ❌ Cannot manage doctors
- ❌ Cannot access settings/billing

**Navigation Access:**

- Dashboard
- Patients
- Doctors (view only)

**Dashboard Data:**

- All clinic statistics
- All recent visits

---

## Role-Based Features

### Login Redirect

All roles are redirected to `/dashboard` after login, but see different data based on their role.

### Dashboard Filtering

- **CLINIC_ADMIN & STAFF**: See all clinic data
- **DOCTOR**: See only their own visits

### Route Protection

Routes are protected using middleware:

- `requireAuth`: User must be logged in
- `requireClinicAccess`: User must belong to a clinic
- `requireRole(...roles)`: User must have one of the specified roles

### View-Level Access Control

UI elements are conditionally rendered based on role:

- Navigation items hidden based on permissions
- Role badge displayed in navigation

---

## Testing Roles

After running the seed script (`npm run seed`), you can test with these accounts:

```
CLINIC_ADMIN: admin@clinic.com / admin123
DOCTOR:       doctor@clinic.com / admin123
STAFF:        staff@clinic.com / admin123
```

---

## Implementation Details

### Role Helper Functions

Located in `src/utils/roles.js`:

- `getRoleRedirect(role)`: Get redirect URL after login
- `hasRole(user, role)`: Check if user has specific role
- `hasAnyRole(user, ...roles)`: Check if user has any of the roles
- `canWrite(user)`: Check if user can perform write operations
- `canManageClinic(user)`: Check if user can manage clinic settings
- `canManageDoctors(user)`: Check if user can manage doctors
- `canCreateVisits(user)`: Check if user can create visits
- `canViewAllData(user)`: Check if user can view all clinic data

### Middleware

Located in `src/middlewares/auth.js`:

- `requireAuth`: Ensures user is logged in
- `requireRole(...roles)`: Ensures user has required role(s)
- `requireClinicAccess`: Ensures user has clinic access

### View Helpers

Role helper functions are available in all EJS templates via `res.locals`:

- `canWrite()`
- `canManageClinic()`
- `canManageDoctors()`
- `canCreateVisits()`
- `canViewAllData()`
- `hasRole(role)`
- `hasAnyRole(...roles)`

---

## Security Notes

1. **Multi-Tenant Isolation**: All queries are scoped by `clinicId` to prevent data leakage
2. **Role-Based Filtering**: Data is filtered at the database level based on role
3. **Route Protection**: Routes are protected at the middleware level
4. **View Protection**: UI elements are conditionally rendered, but backend validation is primary

---

## Adding New Roles

To add a new role:

1. Add role to `UserRole` enum in `src/models/User.js`
2. Add role constant to `src/utils/roles.js`
3. Update helper functions in `src/utils/roles.js`
4. Add role checks to routes in `src/routes/`
5. Update views to handle new role
6. Run Sequelize migration: `npm run db:migrate`

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
