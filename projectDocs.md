# 🏥 MediTrack AI

AI-powered clinic operations platform for modern healthcare practices.

MediTrack AI helps clinics automate appointments, patient workflows, prescriptions, follow-ups, and operational coordination through workflow automation and AI-ready infrastructure.

Built for small and mid-sized clinics that still rely heavily on phone calls, WhatsApp, paper records, and manual administrative work.

---

# 🚀 Why MediTrack AI

Most clinics lose time and revenue due to:

- missed appointments
- manual follow-ups
- overloaded reception staff
- fragmented patient communication
- paper-based workflows
- inconsistent medical documentation

MediTrack AI is designed to reduce operational overhead so clinics can focus more on patient care.

---

# ✨ Core Features

## 👥 Multi-Clinic & Role-Based Access

Each clinic operates in a secure isolated workspace.

Supported roles:

- CLINIC_ADMIN
- DOCTOR
- STAFF

Features:

- multi-user clinic management
- role-based access control
- tenant-scoped data isolation
- doctor-specific workflows
- clinic-wide operational visibility

---

## 🧾 Patient & Consultation Management

- centralized patient records
- complete visit history
- consultation tracking
- prescription management
- digital medical records
- structured patient timeline

---

## 📅 Appointment & Follow-Up Automation

- appointment scheduling
- automated reminders
- follow-up tracking
- recurring visit reminders
- SMS / WhatsApp notification workflows
- missed appointment recovery

---

## 🧠 AI-Ready Workflow Architecture

MediTrack AI is being built as an AI-native clinic operations platform.

Upcoming capabilities:

- AI appointment assistant
- voice-to-prescription generation
- AI-generated consultation summaries
- AI receptionist workflows
- automated patient engagement
- smart follow-up recommendations

---

# 🏗️ Technology Stack

## Backend

- Node.js
- Express.js

## Frontend

- EJS (Server-Side Rendering)
- Tailwind CSS

## Database

- Neon Serverless PostgreSQL
- Sequelize ORM

## Infrastructure

- AWS Lambda
- API Gateway
- Amazon S3
- AWS EventBridge

## Authentication & Security

- session authentication
- bcrypt password hashing
- role-based authorization
- tenant isolation

---

# ⚡ Local Development Setup

## Prerequisites

- Node.js 20+
- PostgreSQL (or Neon database)

---

## Clone Repository

```bash
git clone https://github.com/theshubhamy/MediTrack.git
cd MediTrack
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create `.env` file:

```env
PORT=3301

DATABASE_URL=postgresql://username:password@localhost:5432/meditrack

SESSION_SECRET=your-secret-key
```

---

## Run Database Migrations

```bash
npm run db:migrate
```

---

## Seed Development Database

```bash
npm run seed
```

---

## Build Tailwind CSS

```bash
npm run build:css
```

---

## Start Development Server

```bash
npm run dev
```

Application runs at:

```bash
http://localhost:3301
```

---

# 👨‍⚕️ Demo Credentials

```bash
CLINIC_ADMIN
admin@clinic.com / admin123

DOCTOR
doctor@clinic.com / admin123

STAFF
staff@clinic.com / admin123
```

⚠️ Change all default credentials before production deployment.

---

# 📁 Project Structure

```bash
src/
├── app.js
├── config/
├── routes/
├── middlewares/
├── views/
├── public/
├── jobs/
├── services/
└── utils/
```

---

# 🔐 Role-Based Access Control

## CLINIC_ADMIN

- full clinic access
- manage doctors & staff
- clinic settings
- operational analytics
- billing & configuration

---

## DOCTOR

- manage consultations
- create prescriptions
- manage appointments
- access assigned patient workflows

---

## STAFF

- patient onboarding
- appointment scheduling
- clinic coordination
- operational support workflows

---

# 🛡️ Security

MediTrack AI follows tenant-isolated architecture patterns.

Security features include:

- clinic-scoped queries
- route protection middleware
- password hashing with bcrypt
- role-based authorization
- secure session handling

Recommended production practices:

- HTTPS enforcement
- encrypted backups
- audit logging
- secrets management
- database access controls

---

# ☁️ Infrastructure

MediTrack AI uses a modern serverless architecture:

- AWS Lambda for application compute
- API Gateway for routing
- Neon for serverless PostgreSQL
- Amazon S3 for document storage
- EventBridge for scheduled workflows

Benefits:

- auto scaling
- low operational overhead
- cost-efficient infrastructure
- simplified deployment

---

# 🧪 Available Scripts

```bash
npm start
npm run dev
npm run build:css
npm run db:migrate
npm run db:migrate:undo
npm run seed
npm run setup
```

---

# 🧭 Product Roadmap

## Phase 1

- patient management
- appointment workflows
- prescriptions
- clinic operations

## Phase 2

- WhatsApp integration
- automated reminders
- patient engagement workflows

## Phase 3

- AI appointment assistant
- voice-to-prescription
- AI-generated consultation summaries

## Phase 4

- AI receptionist
- operational analytics
- insurance workflow automation
- multi-clinic intelligence platform

---

# 🌍 Vision

Build the operational infrastructure layer for modern healthcare clinics by reducing administrative workload through workflow automation and AI-assisted operations.

MediTrack AI aims to help clinics spend less time managing operations and more time delivering quality patient care.
