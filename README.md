# 🏥 MediTrack - Clinic Management SaaS

**Node.js + Express + EJS (Server-Side Rendering)**

A multi-tenant SaaS application for small clinics to manage **patients, doctors, medical visit history, prescriptions, and follow-ups**.

> **One clinic = one account, multiple doctors & staff**

---

## 🚀 Quick Start

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
- ✅ Manage own profile (name, phone, preferences, notifications)
- ✅ Change own password
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

**Access to administrative and scheduling features**

- ✅ View all patients, visits, and appointments
- ✅ Create and manage patients
- ✅ Create and manage appointments
- ✅ View all doctors
- ✅ View all statistics and reports
- ❌ Cannot create visits (medical documentation)
- ❌ Cannot create prescriptions
- ❌ Cannot manage doctors
- ❌ Cannot access settings/billing

**Navigation Access:**

- Dashboard
- Patients
- Appointments
- Doctors (view only)

**Dashboard Data:**

- All clinic statistics
- All recent visits
- All appointments

---

## Role Permissions Summary

| Action                      | CLINIC_ADMIN | DOCTOR            | STAFF        |
| --------------------------- | ------------ | ----------------- | ------------ |
| **Patient Management**      |
| Create Patient              | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| Edit Patient                | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| View Patients               | ✅ Yes (All) | ✅ Yes (All)      | ✅ Yes (All) |
| **Visit Management**        |
| Create Visit                | ✅ Yes       | ✅ Yes            | ❌ No        |
| Edit Visit                  | ✅ Yes       | ✅ Yes (Own only) | ❌ No        |
| View Visits                 | ✅ Yes (All) | ✅ Yes (Own only) | ✅ Yes (All) |
| **Prescription Management** |
| Create Prescription         | ✅ Yes       | ✅ Yes            | ❌ No        |
| Edit Prescription           | ✅ Yes       | ✅ Yes (Own only) | ❌ No        |
| View Prescriptions          | ✅ Yes (All) | ✅ Yes (Own only) | ✅ Yes (All) |
| **Appointment Management**  |
| Create Appointment          | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| Edit Appointment            | ✅ Yes       | ✅ Yes (Own only) | ✅ Yes       |
| Cancel Appointment          | ✅ Yes       | ✅ Yes (Own only) | ✅ Yes       |
| View Appointments           | ✅ Yes (All) | ✅ Yes (Own only) | ✅ Yes (All) |
| **Doctor Management**       |
| Invite Doctors              | ✅ Yes       | ❌ No             | ❌ No        |
| Manage Doctors              | ✅ Yes       | ❌ No             | ❌ No        |
| View Doctors                | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| **Clinic Management**       |
| Manage Clinic Settings      | ✅ Yes       | ❌ No             | ❌ No        |
| Access Billing              | ✅ Yes       | ❌ No             | ❌ No        |
| View All Statistics         | ✅ Yes       | ❌ No             | ✅ Yes       |
| **Data Access**             |
| View All Data               | ✅ Yes       | ❌ No             | ✅ Yes       |
| View Own Data Only          | ❌ No        | ✅ Yes            | ❌ No        |
| **Profile Management**      |
| Manage Own Profile          | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| Change Password             | ✅ Yes       | ✅ Yes            | ✅ Yes       |
| Manage Notifications        | ✅ Yes       | ✅ Yes            | ✅ Yes       |

### Notes:

- **DOCTOR**: Can only view/edit their own visits, prescriptions, and appointments
- **STAFF**: Can view all data but cannot create medical records (visits/prescriptions)
- **CLINIC_ADMIN**: Full access to all features and settings

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
