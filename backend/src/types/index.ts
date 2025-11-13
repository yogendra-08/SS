// User related types
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Product related types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCreate {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

// Cart related types
export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  product?: Product;
}

export interface CartItemCreate {
  product_id: number;
  quantity: number;
}

// Wishlist related types
export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: Date;
  product?: Product;
}

// Order related types
export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: Date;
  product?: Product;
}

export interface OrderCreate {
  shipping_address: string;
  items: {
    product_id: number;
    quantity: number;
    price: number;
  }[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// JWT Payload type
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Request with user type
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}
