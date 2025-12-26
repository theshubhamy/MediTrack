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

### 4. READ_ONLY 👁️
**View-only access**

- ✅ View patients
- ✅ View visits (only their own if they're a doctor)
- ❌ Cannot create or edit anything
- ❌ Cannot access settings
- ❌ Cannot manage doctors

**Navigation Access:**
- Dashboard (limited data)
- Patients (view only)

**Dashboard Data:**
- Limited statistics
- Only their own visits (if assigned as doctor)

---

## Role-Based Features

### Login Redirect
All roles are redirected to `/dashboard` after login, but see different data based on their role.

### Dashboard Filtering
- **CLINIC_ADMIN & STAFF**: See all clinic data
- **DOCTOR**: See only their own visits
- **READ_ONLY**: See only their own visits (if assigned as doctor)

### Route Protection
Routes are protected using middleware:
- `requireAuth`: User must be logged in
- `requireClinicAccess`: User must belong to a clinic
- `requireRole(...roles)`: User must have one of the specified roles

### View-Level Access Control
UI elements are conditionally rendered based on role:
- Action buttons (Create, Edit) hidden for READ_ONLY
- Navigation items hidden based on permissions
- Role badge displayed in navigation

---

## Testing Roles

After running the seed script (`npm run seed`), you can test with these accounts:

```
CLINIC_ADMIN: admin@clinic.com / admin123
DOCTOR:       doctor@clinic.com / admin123
STAFF:        staff@clinic.com / admin123
READ_ONLY:    readonly@clinic.com / admin123
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

1. Add role to `ROLES` enum in `prisma/schema.prisma`
2. Add role constant to `src/utils/roles.js`
3. Update helper functions in `src/utils/roles.js`
4. Add role checks to routes in `src/routes/`
5. Update views to handle new role
6. Run Prisma migration: `npm run prisma:migrate`

---

For more information, see the main [README.md](./README.md) file.

