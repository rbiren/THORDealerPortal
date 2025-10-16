# THOR Dealer Portal - Deployment Guide

This guide covers deploying the THOR Dealer Portal to various hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
  - [Docker Deployment](#docker-deployment)
  - [AWS Deployment](#aws-deployment)
  - [Heroku Deployment](#heroku-deployment)
  - [Azure Deployment](#azure-deployment)
  - [DigitalOcean Deployment](#digitalocean-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring and Logging](#monitoring-and-logging)

## Prerequisites

- Production PostgreSQL database
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Cloud hosting account

## Environment Variables

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-very-secure-random-secret-key-change-this

# Database
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=thor_dealer_portal
DB_USER=your-db-username
DB_PASSWORD=your-db-password

# CORS (update with your frontend URL)
CORS_ORIGIN=https://yourdomain.com
```

### Frontend (.env)

```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE thor_dealer_portal;

# Create user (replace with secure password)
CREATE USER thor_admin WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE thor_dealer_portal TO thor_admin;
```

### 2. Run Schema

```bash
psql -U thor_admin -d thor_dealer_portal -f database/schema.sql
```

### 3. Verify Setup

```bash
psql -U thor_admin -d thor_dealer_portal -c "\dt"
```

## Deployment Options

### Docker Deployment

#### 1. Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

#### 2. Create Dockerfile for Frontend

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: thor_dealer_portal
      POSTGRES_USER: thor_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      PORT: 3001
      JWT_SECRET: ${JWT_SECRET}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: thor_dealer_portal
      DB_USER: thor_admin
      DB_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 4. Deploy

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### AWS Deployment

#### Option 1: AWS Elastic Beanstalk

1. Install AWS CLI and EB CLI
2. Initialize:
   ```bash
   eb init
   ```
3. Create environment:
   ```bash
   eb create thor-dealer-portal-prod
   ```
4. Deploy:
   ```bash
   eb deploy
   ```

#### Option 2: AWS EC2

1. Launch EC2 instance (Ubuntu 22.04 recommended)
2. Install Node.js and PostgreSQL
3. Clone repository
4. Set up environment variables
5. Install dependencies and build
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start dist/server.js --name thor-backend
   pm2 save
   pm2 startup
   ```

#### Option 3: AWS ECS (Container)

1. Build Docker images
2. Push to ECR
3. Create ECS cluster
4. Deploy services

### Heroku Deployment

#### Backend

```bash
cd backend
heroku create thor-dealer-portal-api
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

#### Frontend

```bash
cd frontend
heroku create thor-dealer-portal-web
heroku buildpacks:set heroku/nodejs
heroku config:set VITE_API_URL=https://thor-dealer-portal-api.herokuapp.com/api
git push heroku main
```

### Azure Deployment

#### 1. Azure Web App

```bash
# Install Azure CLI
az login

# Create resource group
az group create --name thor-dealer-portal --location eastus

# Create app service plan
az appservice plan create --name thor-plan --resource-group thor-dealer-portal --sku B1 --is-linux

# Create web app for backend
az webapp create --resource-group thor-dealer-portal --plan thor-plan --name thor-api --runtime "NODE|20-lts"

# Create web app for frontend
az webapp create --resource-group thor-dealer-portal --plan thor-plan --name thor-web --runtime "NODE|20-lts"

# Deploy
cd backend
az webapp up --name thor-api --resource-group thor-dealer-portal

cd ../frontend
az webapp up --name thor-web --resource-group thor-dealer-portal
```

### DigitalOcean Deployment

#### 1. Create Droplet

1. Create Ubuntu droplet
2. SSH into droplet
3. Install Node.js and PostgreSQL:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib
   ```

#### 2. Setup Application

```bash
# Clone repository
git clone https://github.com/rbiren/THORDealerPortal.git
cd THORDealerPortal

# Setup backend
cd backend
npm install
npm run build

# Setup frontend
cd ../frontend
npm install
npm run build
```

#### 3. Setup Nginx

```bash
sudo apt install nginx

# Configure Nginx (see nginx.conf below)
sudo nano /etc/nginx/sites-available/thor-portal

# Enable site
sudo ln -s /etc/nginx/sites-available/thor-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Nginx configuration (`/etc/nginx/sites-available/thor-portal`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL in Cloudflare dashboard
4. Set SSL mode to "Full" or "Full (strict)"

## Monitoring and Logging

### PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Application Monitoring

Consider using:
- New Relic
- DataDog
- AWS CloudWatch
- Azure Application Insights

### Error Tracking

- Sentry
- Rollbar
- Bugsnag

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (UFW on Linux)
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up database backups
- [ ] Enable database SSL
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Implement logging and monitoring
- [ ] Set up automated backups
- [ ] Configure fail2ban for SSH protection

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -U thor_admin thor_dealer_portal > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * pg_dump -U thor_admin thor_dealer_portal > /backups/thor_portal_$(date +\%Y\%m\%d).sql
```

### Application Backups

```bash
# Backup entire application
tar -czf thor-portal-backup-$(date +%Y%m%d).tar.gz /path/to/THORDealerPortal
```

## Performance Optimization

1. **Enable Gzip compression** in Nginx
2. **Use CDN** for static assets
3. **Implement caching** (Redis recommended)
4. **Database indexing** (already included in schema)
5. **Load balancing** for high traffic
6. **Database connection pooling**

## Scaling

### Horizontal Scaling

1. Use load balancer (Nginx, AWS ALB, etc.)
2. Deploy multiple backend instances
3. Use Redis for session management
4. Implement database read replicas

### Vertical Scaling

1. Upgrade server resources (CPU, RAM)
2. Optimize database queries
3. Implement caching strategies

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Database connection issues:**
- Check firewall rules
- Verify database credentials
- Ensure database is running

**Build failures:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Review build logs

## Post-Deployment

1. Test all features
2. Monitor logs
3. Set up alerts
4. Document deployment process
5. Create rollback plan
6. Schedule regular maintenance

## Support

For deployment assistance, contact the development team or consult the [README.md](README.md) for additional information.
