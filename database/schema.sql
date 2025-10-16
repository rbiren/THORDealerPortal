-- THOR Dealer Portal Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('dealer', 'technician', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealers table
CREATE TABLE IF NOT EXISTS dealers (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    dealership_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    certifications TEXT[],
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(255) PRIMARY KEY,
    dealer_id VARCHAR(255) REFERENCES dealers(id),
    technician_id VARCHAR(255) REFERENCES technicians(id),
    unit_vin VARCHAR(100) NOT NULL,
    unit_model VARCHAR(100) NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    attachments TEXT[],
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('manual', 'specification', 'warranty', 'technical', 'other')),
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    dealer_id VARCHAR(255) NOT NULL REFERENCES dealers(id),
    unit_model VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    specifications JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'shipped', 'delivered')),
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_dealers_user_id ON dealers(user_id);
CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_technicians_user_id ON technicians(user_id);
CREATE INDEX idx_technicians_status ON technicians(status);
CREATE INDEX idx_claims_dealer_id ON claims(dealer_id);
CREATE INDEX idx_claims_technician_id ON claims(technician_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_orders_dealer_id ON orders(dealer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Insert sample documents
INSERT INTO documents (id, name, type, category, url, uploaded_at) VALUES
    ('1', 'RV Service Manual 2024', 'pdf', 'manual', '/documents/service-manual-2024.pdf', CURRENT_TIMESTAMP),
    ('2', 'Warranty Guidelines', 'pdf', 'warranty', '/documents/warranty-guidelines.pdf', CURRENT_TIMESTAMP),
    ('3', 'Technical Specifications - Class A', 'pdf', 'specification', '/documents/class-a-specs.pdf', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
