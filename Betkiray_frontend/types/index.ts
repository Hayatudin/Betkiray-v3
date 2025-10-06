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
  address: string;
  subCity: string | null;
  phone: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  propertyType: "HOUSE" | "APARTMENT" | "OFFICE" | "RETAIL" | "STUDIO" | "WAREHOUSE";
  city: "Addis Ababa" | "Nairobi" | "Lagos";
  billingPeriod: "DAILY" | "WEEKLY" | "MONTHLY";
  
  // Relational data that should be included from the backend
  media: { mediaUrl: string, mediaType: 'IMAGE' | 'AUDIO' }[];
  reviews: Review[];
  owner: UserData;
  ownerId: string;
  
  // Frontend-only derived property
  image: string; 
};

// Defines the available cities
export type City = "Addis Ababa" | "Nekemt" | "Jijiga" | "Hawassa" | "Shashemene" | "Arba Minch" | "Hosaina" | "Jimma" | "Mekele";