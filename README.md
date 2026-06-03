# 🏥 MediTrack AI

**AI-powered clinic operations platform for modern healthcare practices.**

MediTrack AI helps clinics automate appointments, patient workflows, prescriptions, follow-ups, and operational coordination through workflow automation and AI-ready infrastructure.

Built for small and mid-sized clinics that still rely heavily on phone calls, WhatsApp, paper records, and manual administrative work.

---

## 🚀 Why MediTrack AI

Most clinics lose time and revenue due to:

- Missed appointments
- Manual follow-ups
- Overloaded reception staff
- Fragmented patient communication
- Paper-based workflows
- Inconsistent medical documentation

MediTrack AI is designed to reduce operational overhead so clinics can focus more on patient care.

---

## ✨ Core Features

### 👥 Multi-Clinic & Role-Based Access
Each clinic operates in a secure, isolated workspace.
- **Multi-user Clinic Management:** Support for CLINIC_ADMIN, DOCTOR, and STAFF roles.
- **Tenant-Scoped Data Isolation:** Multi-tenant architecture ensuring data privacy.
- **Role-Based Access Control (RBAC):** Restrict features and views based on roles.
- **Doctor-Specific Workflows:** Custom dashboards and scheduling for clinic practitioners.
- **Clinic-Wide Operational Visibility:** Overview stats for admins and staff.

### 🧾 Patient & Consultation Management
- **Centralized Patient Records:** Complete database with search, demographics, and clinical history.
- **Visit History:** Log and track patient visits chronologically.
- **Consultation Tracking:** Record medical notes, vitals, and diagnoses.
- **Prescription Management:** Create, view, print, and share digital prescriptions.
- **Structured Patient Timeline:** Chronological view of all touchpoints.

### 📅 Appointment & Follow-Up Automation
- **Appointment Scheduling:** Interactive booking and doctor availability management.
- **Automated Reminders:** Patient notification alerts to prevent no-shows.
- **Follow-up Tracking:** Scheduled tasks for future visits and continuity of care.
- **SMS / WhatsApp Workflows:** Built-in hooks for notification pathways.
- **Missed Appointment Recovery:** Workflows to re-engage patients.

### 🧠 AI-Ready Workflow Architecture
MediTrack AI is architected from the ground up to support modern AI integrations:
- **AI Appointment Assistant:** Automated scheduling over text.
- **Voice-to-Prescription:** Auto-transcribe consultations into digital prescriptions.
- **AI Consultation Summaries:** Generate structured summaries from doctor notes.
- **AI Receptionist Workflows:** Direct patient inquiries automated using NLP.
- **Smart Follow-up Recommendations:** Predictive follow-ups based on patient history.

---

## 🧱 Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Server-Side Rendering), Tailwind CSS
- **Database:** PostgreSQL (with Neon Serverless PostgreSQL support) & Sequelize ORM
- **Authentication & Security:** Session-based auth, bcrypt password hashing, and tenant-scoped data isolation
- **Jobs & Workflows:** node-cron for scheduled tasks / EventBridge hooks
- **Infrastructure (Cloud/Serverless ready):** AWS Lambda (compute), API Gateway (routing), Amazon S3 (document storage), and AWS EventBridge (workflows)

---

## 📁 Project Structure

```
src/
├── app.js              # Main application entry
├── config/             # Configuration files (database, session, email)
├── jobs/               # Scheduled background jobs
├── middlewares/        # Authentication and authorization middleware
├── migrations/         # Database migration files
├── models/             # Sequelize database models
├── public/             # Static assets (CSS, JS, images)
├── routes/             # Express routes (auth, patients, visits, etc.)
├── utils/              # Helper functions, roles utility, and seed data
└── views/              # EJS templates and layout files
```

---

## ⚡ Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or cloud-hosted like Neon)

### 1. Clone the Repository
```bash
git clone https://github.com/theshubhamy/MediTrack.git
cd MediTrack
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (you can copy `.env.example` as a starting point):
```env
PORT=3301
DATABASE_URL=postgresql://username:password@localhost:5432/meditrack
SESSION_SECRET=your-secure-session-secret-key
```

### 4. Run Database Migrations
Create the database tables:
```bash
npm run db:migrate
```

### 5. Seed Development Database
Populate the database with default roles, credentials, and dummy data:
```bash
npm run seed
```

### 6. Build Tailwind CSS
Build/compile the public CSS assets:
```bash
npm run build:css
```

### 7. Start Development Server
Start the application in development mode with nodemon:
```bash
npm run dev
```
The application will be running at `http://localhost:3301`.

---

## 🔐 Default Credentials

After running the seed script (`npm run seed`), you can test the application using the following accounts:

- **CLINIC_ADMIN:** `admin@clinic.com` / `admin123`
- **DOCTOR:** `doctor@clinic.com` / `admin123`
- **STAFF:** `staff@clinic.com` / `admin123`

⚠️ *Please ensure all default credentials are changed before deploying the application to production!*

---

## 🔐 Role-Based Access Control

This system supports role-based access control (RBAC) to ensure multi-tenant security and functional alignment.

### Roles Overview

#### 1. CLINIC_ADMIN 👑
*Full access to all clinic features.*
- ✅ View all patients, visits, and doctors.
- ✅ Create and manage patient profiles.
- ✅ Create and manage visits.
- ✅ Invite and manage doctor and staff accounts.
- ✅ Access clinic settings, billing, and operational analytics.
- **Navigation Access:** Dashboard, Patients, Doctors, Settings.

#### 2. DOCTOR 👨‍⚕️
*Access to clinical care and consultation workflows.*
- ✅ View all patients.
- ✅ Create and manage visits assigned to them (cannot view other doctors' visits).
- ✅ Manage their own profile (name, phone, notifications, etc.).
- ✅ Change their own password.
- ❌ Cannot manage clinic doctors/staff or access settings/billing.
- **Navigation Access:** Dashboard (shows only their visits), Patients, Doctors (view-only).

#### 3. STAFF 👤
*Access to administrative and scheduling features.*
- ✅ View all patients, visits, and appointments.
- ✅ Create and manage patient profiles.
- ✅ Create and manage appointments.
- ✅ View all clinic doctors.
- ✅ View all statistics and reports.
- ❌ Cannot document medical records (create/edit visits and prescriptions).
- ❌ Cannot manage clinic accounts or access billing/settings.
- **Navigation Access:** Dashboard, Patients, Appointments, Doctors (view-only).

---

### Role Permissions Summary

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

### Implementation Details

#### Role Helper Functions
Located in `./src/utils/roles.js`:
- `getRoleRedirect(role)`: Get redirect URL after login.
- `hasRole(user, role)`: Check if user has specific role.
- `hasAnyRole(user, ...roles)`: Check if user has any of the roles.
- `canWrite(user)`: Check if user can perform write operations.
- `canManageClinic(user)`: Check if user can manage clinic settings.
- `canManageDoctors(user)`: Check if user can manage doctors.
- `canCreateVisits(user)`: Check if user can create visits.
- `canViewAllData(user)`: Check if user can view all clinic data.

#### Middleware
Located in `./src/middlewares/auth.js`:
- `requireAuth`: Ensures user is logged in.
- `requireRole(...roles)`: Ensures user has required role(s).
- `requireClinicAccess`: Ensures user has clinic access.

#### View Helpers
Role helper functions are available in all EJS templates via `res.locals` (e.g., `canWrite()`, `canManageClinic()`, `canManageDoctors()`, `canCreateVisits()`, `canViewAllData()`, `hasRole(role)`, `hasAnyRole(...roles)`).

---

## 🛡️ Security

MediTrack AI follows a tenant-isolated architecture ensuring high security standards:
- **Clinic-Scoped Queries:** All database queries are scoped by `clinicId` to prevent cross-tenant data leakage.
- **Route Protection Middleware:** Access controls are strictly enforced at the routing level.
- **Password Hashing:** Passwords securely hashed with `bcrypt`.
- **Role-Based Authorization:** View-level checks paired with robust API authorization.
- **Secure Session Handling:** Express sessions with customizable secrets.

*Recommended Production Practices:*
- HTTPS enforcement for secure transit.
- Encrypted backups & secure database access control.
- Centralized secrets management and audit logging.

---

## ☁️ Infrastructure

MediTrack AI is architected for modern serverless scaling:
- **AWS Lambda:** Scalable, compute-on-demand for the Express backend.
- **API Gateway:** Entry point for HTTP routing and CORS policy management.
- **Neon:** Serverless PostgreSQL providing scalable database operations.
- **Amazon S3:** Document storage for digital prescriptions and clinic files.
- **AWS EventBridge:** Automated, event-driven scheduling for patient notifications/follow-up cron jobs.

---

## 🛠️ Available Scripts

Run these scripts from the project root:
- `npm start`: Start production server.
- `npm run dev`: Start development server (using Nodemon).
- `npm run build:css`: Build and watch Tailwind CSS.
- `npm run db:migrate`: Run database migrations.
- `npm run db:migrate:undo`: Rollback the last migration.
- `npm run seed`: Seed the database with default clinic data.
- `npm run setup`: Quick setup (installs dependencies and compiles CSS).
- `npm run setup:full`: Complete setup (installs, compiles CSS, migrates, and seeds).

---

## 🧭 Product Roadmap

### Phase 1: Core Operations
- Patient onboarding and record management.
- Basic appointment scheduling workflows.
- Visit logs and digital prescriptions.
- Basic clinic statistics.

### Phase 2: Engagement Automation
- WhatsApp & SMS notifications.
- Automated appointment reminders.
- Dynamic patient engagement workflows.

### Phase 3: AI Copilot
- AI-based appointment assistant.
- Voice-to-prescription transcription.
- AI-generated consultation summaries.

### Phase 4: Clinic Intelligence
- AI receptionist bot.
- Deep operational analytics.
- Insurance workflow automation.
- Multi-clinic intelligence platform.

---

## 🌍 Vision

Our vision is to build the foundational operational infrastructure layer for modern healthcare practices. By automating administrative overhead and embedding AI-ready capabilities directly into daily workflows, MediTrack AI helps clinics spend less time managing paperwork and more time delivering high-quality patient care.

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!
