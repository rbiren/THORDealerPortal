# THOR Dealer Portal API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "THOR Dealer Portal API is running"
}
```

---

## Authentication Endpoints

### POST /auth/login
Login to the portal.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "dealer"
  }
}
```

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "dealer",
  "additionalInfo": {}
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "dealer"
  }
}
```

---

## Dealer Endpoints

### GET /dealers
Get all dealers (requires authentication).

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "id": "dealer-id",
    "userId": "user-id",
    "companyName": "ABC RV Dealership",
    "contactName": "John Doe",
    "phone": "555-1234",
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "dealershipNumber": "DLR-001",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /dealers/:id
Get dealer by ID (requires authentication).

**Parameters:**
- `id` (path) - Dealer ID

**Response:**
```json
{
  "id": "dealer-id",
  "userId": "user-id",
  "companyName": "ABC RV Dealership",
  "contactName": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "dealershipNumber": "DLR-001",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### POST /dealers
Create a new dealer (requires authentication, dealer or admin role).

**Request Body:**
```json
{
  "companyName": "ABC RV Dealership",
  "contactName": "John Doe",
  "phone": "555-1234",
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701",
  "dealershipNumber": "DLR-001"
}
```

### PUT /dealers/:id
Update dealer information (requires authentication, dealer or admin role).

**Request Body:**
```json
{
  "companyName": "Updated RV Dealership",
  "phone": "555-5678"
}
```

---

## Technician Endpoints

### GET /technicians
Get all technicians (requires authentication).

### GET /technicians/:id
Get technician by ID (requires authentication).

### POST /technicians
Create a new technician (requires authentication, technician or admin role).

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "555-4321",
  "certifications": ["ASE Certified", "RV Technician Level 2"],
  "location": "Chicago, IL"
}
```

### PUT /technicians/:id
Update technician information (requires authentication, technician or admin role).

---

## Claims Endpoints

### GET /claims
Get all claims (requires authentication).

**Query Parameters:**
- `dealerId` (optional) - Filter by dealer ID
- `technicianId` (optional) - Filter by technician ID

**Response:**
```json
[
  {
    "id": "claim-id",
    "dealerId": "dealer-id",
    "unitVin": "1HGBH41JXMN109186",
    "unitModel": "Class A Motorhome",
    "claimType": "Warranty Repair",
    "description": "Engine repair needed",
    "amount": 1500.00,
    "status": "pending",
    "submittedAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "attachments": []
  }
]
```

### GET /claims/:id
Get claim by ID (requires authentication).

### POST /claims
Submit a new claim (requires authentication, dealer or technician role).

**Request Body:**
```json
{
  "dealerId": "dealer-id",
  "unitVin": "1HGBH41JXMN109186",
  "unitModel": "Class A Motorhome",
  "claimType": "Warranty Repair",
  "description": "Engine repair needed",
  "amount": 1500.00,
  "attachments": []
}
```

### PUT /claims/:id
Update claim (requires authentication).

### PATCH /claims/:id/status
Update claim status (requires authentication, admin role only).

**Request Body:**
```json
{
  "status": "approved"
}
```

---

## Repository Endpoints

### GET /repository
Get all documents (requires authentication).

**Query Parameters:**
- `category` (optional) - Filter by category (manual, specification, warranty, technical, other)
- `search` (optional) - Search by document name

**Response:**
```json
[
  {
    "id": "1",
    "name": "RV Service Manual 2024",
    "type": "pdf",
    "category": "manual",
    "url": "/documents/service-manual-2024.pdf",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /repository/:id
Get document by ID (requires authentication).

---

## Orders Endpoints

### GET /orders
Get all orders (requires authentication).

**Query Parameters:**
- `dealerId` (optional) - Filter by dealer ID

**Response:**
```json
[
  {
    "id": "order-id",
    "dealerId": "dealer-id",
    "unitModel": "Class A Motorhome 2024",
    "quantity": 5,
    "specifications": {},
    "status": "pending",
    "estimatedDelivery": "2024-06-01T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### GET /orders/:id
Get order by ID (requires authentication).

### POST /orders
Create a new order (requires authentication, dealer role).

**Request Body:**
```json
{
  "dealerId": "dealer-id",
  "unitModel": "Class A Motorhome 2024",
  "quantity": 5,
  "specifications": {
    "color": "white",
    "features": ["solar panels", "upgraded interior"]
  },
  "estimatedDelivery": "2024-06-01T00:00:00Z"
}
```

### PUT /orders/:id
Update order (requires authentication, dealer or admin role).

### PATCH /orders/:id/status
Update order status (requires authentication, admin role only).

**Request Body:**
```json
{
  "status": "shipped"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error message describing what went wrong"
}
```

### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

---

## Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## User Roles

### dealer
- Can view and create claims
- Can view repository documents
- Can create and manage orders
- Can manage their own dealer profile

### technician
- Can view and create claims
- Can view repository documents
- Can manage their own technician profile

### admin
- Full access to all endpoints
- Can approve/reject claims
- Can update order statuses
- Can manage all users and data
