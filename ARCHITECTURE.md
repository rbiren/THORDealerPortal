# THOR Dealer Portal - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          THOR Dealer Portal                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│      Frontend (React)    │◄────────┤      Backend (Node.js)   │
│                          │  HTTP   │                          │
│  • React + TypeScript    │  REST   │  • Express + TypeScript  │
│  • Vite Build Tool       │  API    │  • JWT Authentication    │
│  • React Router          │         │  • Role-based Auth       │
│  • Axios HTTP Client     │         │  • RESTful Endpoints     │
│  • Context API State     │         │                          │
│                          │         │                          │
│  Pages:                  │         │  Routes:                 │
│  - Login/Register        │         │  - /api/auth             │
│  - Dashboard             │         │  - /api/dealers          │
│  - Claims                │         │  - /api/technicians      │
│  - Repository            │         │  - /api/claims           │
│  - Orders                │         │  - /api/repository       │
│                          │         │  - /api/orders           │
└──────────────────────────┘         └────────────┬─────────────┘
                                                   │
                                                   │
                                                   ▼
                                     ┌──────────────────────────┐
                                     │   PostgreSQL Database    │
                                     │                          │
                                     │  Tables:                 │
                                     │  - users                 │
                                     │  - dealers               │
                                     │  - technicians           │
                                     │  - claims                │
                                     │  - documents             │
                                     │  - orders                │
                                     └──────────────────────────┘
```

## Technology Stack

### Frontend Layer
- **React 18+**: UI library for building interactive interfaces
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Axios**: Promise-based HTTP client
- **Context API**: State management for authentication

### Backend Layer
- **Node.js 20+**: JavaScript runtime
- **Express 5**: Web framework
- **TypeScript**: Type-safe server development
- **JSON Web Tokens (JWT)**: Stateless authentication
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing

### Database Layer
- **PostgreSQL**: Relational database
- **pg**: Node.js PostgreSQL client
- Schema includes: users, dealers, technicians, claims, documents, orders

## Application Flow

### Authentication Flow

```
┌──────┐                 ┌──────────┐                 ┌──────────┐
│Client│                 │  Backend │                 │ Database │
└───┬──┘                 └────┬─────┘                 └────┬─────┘
    │                         │                            │
    │ POST /auth/register     │                            │
    │─────────────────────────►                            │
    │ {email, password, role} │                            │
    │                         │  Hash password             │
    │                         │  Generate user ID          │
    │                         │  Store user                │
    │                         │───────────────────────────►│
    │                         │                            │
    │                         │  Create JWT token          │
    │◄─────────────────────────                            │
    │ {token, user}           │                            │
    │                         │                            │
    │ Store token in          │                            │
    │ localStorage            │                            │
    │                         │                            │
    │ All subsequent requests │                            │
    │ include Authorization   │                            │
    │ header with token       │                            │
    │                         │                            │
```

### Claims Submission Flow

```
┌──────┐                 ┌──────────┐                 ┌──────────┐
│Client│                 │  Backend │                 │ Database │
└───┬──┘                 └────┬─────┘                 └────┬─────┘
    │                         │                            │
    │ POST /api/claims        │                            │
    │─────────────────────────►                            │
    │ Authorization: Bearer   │                            │
    │ + claim data            │                            │
    │                         │  Verify JWT token          │
    │                         │  Check user role           │
    │                         │                            │
    │                         │  Create claim              │
    │                         │───────────────────────────►│
    │                         │                            │
    │                         │  Claim saved               │
    │◄─────────────────────────◄────────────────────────────│
    │ {claim with ID,         │                            │
    │  status: "pending"}     │                            │
    │                         │                            │
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  password: string; // hashed
  role: 'dealer' | 'technician' | 'admin';
  createdAt: Date;
}
```

### Dealer Model
```typescript
interface Dealer {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dealershipNumber: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}
```

### Claim Model
```typescript
interface Claim {
  id: string;
  dealerId?: string;
  technicianId?: string;
  unitVin: string;
  unitModel: string;
  claimType: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: Date;
  updatedAt: Date;
  attachments: string[];
}
```

### Order Model
```typescript
interface Order {
  id: string;
  dealerId: string;
  unitModel: string;
  quantity: number;
  specifications: any;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered';
  estimatedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Architecture

### Authentication
- JWT-based stateless authentication
- Tokens expire after 24 hours
- Tokens stored in browser localStorage
- All protected routes require valid token

### Authorization
- Role-based access control (RBAC)
- Three user roles: dealer, technician, admin
- Middleware validates user roles for protected endpoints
- Different UI based on user role

### Password Security
- Passwords hashed using bcrypt (10 salt rounds)
- Never stored or transmitted in plain text
- Password complexity requirements recommended

### API Security
- CORS enabled for trusted origins
- Rate limiting recommended for production
- Input validation on all endpoints
- SQL injection protection (parameterized queries)

## API Architecture

### RESTful Design
- Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Resource-based URLs
- JSON request/response format
- Consistent error handling

### Endpoints Structure
```
/api
  /auth
    POST /login
    POST /register
  
  /dealers
    GET    /
    GET    /:id
    POST   /
    PUT    /:id
  
  /technicians
    GET    /
    GET    /:id
    POST   /
    PUT    /:id
  
  /claims
    GET    /
    GET    /:id
    POST   /
    PUT    /:id
    PATCH  /:id/status
  
  /repository
    GET    /
    GET    /:id
  
  /orders
    GET    /
    GET    /:id
    POST   /
    PUT    /:id
    PATCH  /:id/status
```

## Frontend Architecture

### Component Hierarchy
```
App
├── AuthProvider (Context)
│   ├── Login
│   ├── Register
│   └── PrivateRoute
│       ├── Dashboard
│       ├── Claims
│       │   └── ClaimForm
│       ├── Repository
│       │   └── DocumentCard
│       └── Orders
│           └── OrderForm
```

### State Management
- **Global State**: Authentication context (user, token)
- **Local State**: Component state with React hooks
- **Server State**: Fetched via API calls, no caching layer

### Routing Strategy
- React Router for client-side routing
- Protected routes require authentication
- Automatic redirect to login for unauthenticated users
- Role-based route rendering

## Deployment Architecture

### Development
```
┌─────────────┐         ┌─────────────┐
│  Frontend   │         │   Backend   │
│ localhost:  │────────►│ localhost:  │
│    5173     │  HTTP   │    3001     │
└─────────────┘         └─────────────┘
```

### Production (Recommended)
```
┌──────────┐      ┌─────────────┐      ┌──────────────┐
│  Users   │─────►│   Nginx/    │─────►│   Backend    │
│          │ HTTPS │   CDN       │ HTTP │   Servers    │
└──────────┘      │             │      │  (Node.js)   │
                  │  - Frontend │      │              │
                  │  - SSL      │      └───────┬──────┘
                  │  - Gzip     │              │
                  │  - Cache    │              │
                  └─────────────┘              ▼
                                    ┌──────────────────┐
                                    │   PostgreSQL     │
                                    │   Database       │
                                    │   - Replicas     │
                                    │   - Backups      │
                                    └──────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless backend allows multiple instances
- Load balancer distributes traffic
- Session data in JWT (no server-side sessions)

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis)

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling
- Query optimization and indexing
- Partitioning for large tables

## Future Enhancements

### Short Term
- [ ] Email notifications via SendGrid/AWS SES
- [ ] File upload for claim attachments
- [ ] Advanced search and filtering
- [ ] Export data to CSV/PDF
- [ ] Real-time notifications

### Medium Term
- [ ] WebSocket for real-time updates
- [ ] Advanced reporting and analytics
- [ ] Multi-factor authentication (MFA)
- [ ] API rate limiting
- [ ] Comprehensive audit logging

### Long Term
- [ ] Mobile applications (iOS/Android)
- [ ] Integration with existing THOR systems
- [ ] Machine learning for claim analysis
- [ ] Chatbot support
- [ ] Multi-language support
- [ ] Advanced workflow automation

## Performance Considerations

### Frontend Optimization
- Code splitting with dynamic imports
- Lazy loading of routes
- Image optimization
- Minification and compression
- CDN for static assets

### Backend Optimization
- Database query optimization
- Connection pooling
- Caching frequently accessed data
- Compression middleware
- Asynchronous operations

### Database Optimization
- Proper indexing (already implemented)
- Query optimization
- Regular maintenance (VACUUM, ANALYZE)
- Monitoring slow queries
- Connection pooling

## Monitoring and Observability

### Recommended Tools
- **Application Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Logging**: Winston, Morgan
- **Analytics**: Google Analytics, Mixpanel
- **Uptime Monitoring**: Pingdom, UptimeRobot

### Key Metrics
- API response times
- Error rates
- User authentication success/failure
- Database query performance
- Server resource utilization
- User engagement metrics

## Maintenance

### Regular Tasks
- Database backups (daily)
- Security updates (weekly)
- Dependency updates (monthly)
- Performance reviews (monthly)
- User feedback analysis (ongoing)

### Version Control
- Git for source control
- Feature branches for development
- Pull requests for code review
- CI/CD for automated testing and deployment

---

This architecture is designed to be scalable, maintainable, and secure while providing a solid foundation for future enhancements.
