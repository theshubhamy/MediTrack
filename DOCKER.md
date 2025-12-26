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

Application: http://localhost:3000

## Services

- **PostgreSQL** - Port 5432 (User: `meditrack`, Password: `meditrack_password`)
- **Redis** - Port 6379 (Password: `redis_password`)
- **Application** - Port 3000

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
docker-compose exec app npx prisma migrate deploy

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

For local setup, see [SETUP.md](./SETUP.md)
