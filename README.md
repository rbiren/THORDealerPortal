# THOR Dealer Portal

A comprehensive web portal for THOR Industries RV dealers and mobile technicians to access information, submit claims, access repositories, order new units, and more.

## Features

### For Dealers
- **Claims Management**: Submit and track warranty claims
- **Unit Ordering**: Place orders for new RV units and track shipments
- **Document Repository**: Access manuals, specifications, and technical documents
- **Dashboard**: Overview of all activities and quick access to key features

### For Mobile Technicians
- **Claims Submission**: Submit warranty claims for repairs
- **Document Repository**: Access technical documentation and service manuals
- **Profile Management**: Manage certifications and contact information

### For Administrators
- **User Management**: Manage dealer and technician accounts
- **Claims Approval**: Review and approve/reject warranty claims
- **Order Management**: Track and update order statuses
- **Content Management**: Upload and manage documents in the repository

## Technology Stack

### Backend
- **Node.js** with **Express** - API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Database (configuration included)
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** with **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
THORDealerPortal/
├── backend/
│   ├── src/
│   │   ├── config/        # Database and configuration
│   │   ├── middleware/    # Authentication middleware
│   │   ├── routes/        # API route handlers
│   │   ├── types/         # TypeScript type definitions
│   │   └── server.ts      # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rbiren/THORDealerPortal.git
   cd THORDealerPortal
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up Environment Variables**

   Backend (.env):
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Frontend (.env):
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:3001`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Building for Production

1. **Build the Backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```
   The production files will be in the `dist` folder.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dealers
- `GET /api/dealers` - Get all dealers
- `GET /api/dealers/:id` - Get dealer by ID
- `POST /api/dealers` - Create new dealer
- `PUT /api/dealers/:id` - Update dealer

### Technicians
- `GET /api/technicians` - Get all technicians
- `GET /api/technicians/:id` - Get technician by ID
- `POST /api/technicians` - Create new technician
- `PUT /api/technicians/:id` - Update technician

### Claims
- `GET /api/claims` - Get all claims
- `GET /api/claims/:id` - Get claim by ID
- `POST /api/claims` - Submit new claim
- `PUT /api/claims/:id` - Update claim
- `PATCH /api/claims/:id/status` - Update claim status (admin only)

### Repository
- `GET /api/repository` - Get all documents
- `GET /api/repository/:id` - Get document by ID

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order (dealers only)
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status (admin only)

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts (dealers, technicians, admins)
- **dealers** - Dealer information
- **technicians** - Mobile technician information
- **claims** - Warranty claims
- **documents** - Repository documents
- **orders** - Unit orders

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- CORS configuration

## Future Enhancements

- [ ] Email notifications
- [ ] File upload for claim attachments
- [ ] Real-time updates with WebSockets
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] Integration with THOR's existing systems
- [ ] Multi-language support
- [ ] Advanced search and filtering

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. All rights reserved by THOR Industries.

## Contact

For support or questions, please contact the development team.