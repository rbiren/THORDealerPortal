# THOR Dealer Portal - Quick Start Guide

Get the THOR Dealer Portal up and running in minutes!

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Git

## Quick Setup (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/rbiren/THORDealerPortal.git
cd THORDealerPortal
```

### 2. Setup Backend

```bash
cd backend
npm install
```

The backend will run with default settings. For production, create a `.env` file:

```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

For production, create a `.env` file:

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will start on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will start on: http://localhost:5173

### 5. Open Your Browser

Navigate to: http://localhost:5173

## First Login

Since this is a new installation, you'll need to register first:

1. Click "Don't have an account? Register"
2. Fill in your details:
   - Email: your@email.com
   - Password: (choose a secure password)
   - Role: Select "Dealer" or "Mobile Technician"
3. Click "Register"
4. You'll be automatically logged in and redirected to the dashboard

## Testing the Features

### Submit a Claim

1. From the dashboard, click "Claims"
2. Click "Submit New Claim"
3. Fill in the claim details:
   - Unit VIN (e.g., 1HGBH41JXMN109186)
   - Unit Model (e.g., Class A Motorhome)
   - Claim Type (e.g., Warranty Repair)
   - Description
   - Amount
4. Click "Submit Claim"
5. View your claim in the list below

### Browse Documents

1. From the dashboard, click "Document Repository"
2. Filter by category or search by name
3. Click "View Document" to access documents

### Place an Order (Dealers Only)

1. From the dashboard, click "Order Units"
2. Click "Place New Order"
3. Fill in order details:
   - Unit Model
   - Quantity
   - Specifications
4. Click "Submit Order"
5. Track your order status

## API Testing

Test the API directly with curl:

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dealer.com",
    "password": "password123",
    "role": "dealer",
    "additionalInfo": {}
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@dealer.com",
    "password": "password123"
  }'
```

### Get Documents (with authentication)
```bash
curl http://localhost:3001/api/repository \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the 'dist' folder with your web server
```

## Troubleshooting

### Port Already in Use

**Backend (3001):**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

**Frontend (5173):**
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

### Node Modules Issues

```bash
# Clear and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild
cd backend
npm run build

cd ../frontend
npm run build
```

## Database Setup (Optional)

The application currently uses in-memory storage for development. To use PostgreSQL:

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE thor_dealer_portal;
   ```
3. Run the schema:
   ```bash
   psql -d thor_dealer_portal -f database/schema.sql
   ```
4. Update `backend/.env` with your database credentials
5. Implement database queries in the backend routes (replace mock data)

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [API.md](API.md) for complete API documentation
- Explore the code structure
- Customize the UI to match your brand
- Implement production database
- Add email notifications
- Deploy to your hosting provider

## Support

For issues or questions:
- Check the README.md
- Review API.md for endpoint details
- Contact the development team

## Security Note

⚠️ **Important for Production:**

1. Change `JWT_SECRET` in backend/.env to a strong random value
2. Use HTTPS in production
3. Implement proper password requirements
4. Set up database backups
5. Enable CORS only for trusted domains
6. Implement rate limiting
7. Add input validation and sanitization
8. Set up monitoring and logging

Happy coding! 🚀
