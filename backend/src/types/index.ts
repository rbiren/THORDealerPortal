export interface User {
  id: string;
  email: string;
  password: string;
  role: 'dealer' | 'technician' | 'admin';
  createdAt: Date;
}

export interface Dealer {
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

export interface Technician {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  certifications: string[];
  location: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Claim {
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

export interface Document {
  id: string;
  name: string;
  type: string;
  category: 'manual' | 'specification' | 'warranty' | 'technical' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface Order {
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'dealer' | 'technician';
  additionalInfo: any;
}
