# 🚀 Setup Guide

Complete setup instructions for MediTrack application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or MySQL)
- npm package manager

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-super-secret-session-key

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/meditrack?schema=public"

# Optional: Redis for sessions
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Database Setup

**PostgreSQL:**

```bash
createdb meditrack
```

**MySQL:**

```sql
CREATE DATABASE meditrack;
```

Update `prisma/schema.prisma` if using MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 4. Build Assets

```bash
npm run build:css
```

### 5. Database Migration

```bash
npm run prisma:migrate
```

### 6. Seed Database (Optional)

```bash
npm run seed
```

This creates test users with different roles. Default password: `admin123`

### 7. Start Application

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Visit http://localhost:3000

---

## Troubleshooting

### Database Connection Issues

- Verify database is running
- Check `DATABASE_URL` in `.env`
- Ensure database user has proper permissions

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Prisma Client Not Generated

```bash
npm run prisma:generate
```

### CSS Not Building

```bash
npm run build:css
```

---

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use PM2 for process management:
   ```bash
   pm2 start src/app.js --name meditrack
   pm2 save
   ```
3. Set up Nginx as reverse proxy
4. Configure SSL with Let's Encrypt
5. Set up Redis for session storage

---

## Security Checklist

- [ ] Change default `SESSION_SECRET`
- [ ] Change default admin credentials
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Set up Redis for sessions
- [ ] Configure file upload limits
- [ ] Set up regular database backups

---

For Docker setup, see [DOCKER.md](./DOCKER.md)
