// types/index.ts

// The shape of the User data from your NestJS backend
export interface UserData {
  isBanned: any;
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN'; 
  phone?: string;
  image?: string;
}

// The shape of a single Review
export interface Review {
  id: number;
  rating: number;
  comment: string;
  user: Pick<UserData, 'id' | 'name' | 'image'>; // Only include public user info
  createdAt: string;
}

// The shape of the Property data returned from your backend
export type Property = {
  [x: string]: any;
  id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  areaSqm: number;
  type: "House" | "Apartment" | "Office" | "Retail" | "Studio" | "Warehouse";
  city: "Addis Ababa" | "Nairobi" | "Lagos";
  billingPeriod: "Monthly" | "Yearly";
  
  // Relational data that should be included from the backend
  media: { mediaUrl: string }[];
  reviews: Review[];
  owner: UserData;
  
  // Frontend-only derived property
  image: string; 
};

// Defines the available cities
export type City = "Addis Ababa" | "Nairobi" | "Lagos";