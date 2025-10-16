export interface User {
  id: string;
  email: string;
  role: 'dealer' | 'technician' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Dealer {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dealershipNumber: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  certifications: string[];
  location: string;
  status: 'active' | 'inactive';
}

export interface Claim {
  id: string;
  unitVin: string;
  unitModel: string;
  claimType: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category: 'manual' | 'specification' | 'warranty' | 'technical' | 'other';
  url: string;
}

export interface Order {
  id: string;
  unitModel: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered';
  estimatedDelivery: string;
  createdAt: string;
}
