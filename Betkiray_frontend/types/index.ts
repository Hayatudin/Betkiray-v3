// types/index.ts

export interface UserData {
  isBanned: any;
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN'; 
  phone?: string;
  image?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  user: Pick<UserData, 'id' | 'name' | 'image'>;
  createdAt: string;
}

export type Property = {
  [x: string]: any;
  id: number;
  title: string;
  description: string;
  address: string; 
  location: string; 
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | null;
  propertyType: "HOUSE" | "APARTMENT" | "OFFICE" | "RETAIL" | "STUDIO" | "WAREHOUSE";
  city: "Addis Ababa" | "Nekemt" | "Jijiga" | "Hawassa" | "Shashemene" | "Arba Minch" | "Hosaina" | "Jimma" | "Mekele";
  billingPeriod: "DAILY" | "WEEKLY" | "MONTHLY";
  isFurnished: boolean;
  isNegotiable: boolean;
  includeUtilities: boolean;
  
  media: { mediaUrl: string; mediaType: 'IMAGE' | 'AUDIO' }[];
  reviews: Review[];
  owner: UserData;
  
  image: string; 
};

export type City = "Addis Ababa" | "Nekemt" | "Jijiga" | "Hawassa" | "Shashemene" | "Arba Minch" | "Hosaina" | "Jimma" | "Mekele";