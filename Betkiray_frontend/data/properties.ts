// import { Property, City } from "@/types/index";

// // export const allPropertyData: Record<City, Property[]> = {
// //   "Addis Ababa": [
// //     {
// //       id: 1,
// //       title: "Luxury 2BHK Apartment",
// //       location: "CMC, Addis Ababa",
// //       price: "ETB 20,000",
// //       period: "/month",
// //       bedrooms: "2-bed",
// //       area: "100 m²",
// //       type: "Apartment",
// //       city: "Addis Ababa",
// //       image:
// //         "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=700&fit=crop",
// //       images: [
// //         "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=900&fit=crop",
// //         "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=900&fit=crop",
// //         "https://images.unsplash.com/photo-1560448075-bb4caa6c1efd?w=1200&h=900&fit=crop",
// //       ],
// //       coords: { lat: 9.0206, lng: 38.8096 },
// //       description:
// //         "Spacious 2-bedroom apartment with modern finishes in CMC. Close to amenities and transit.",
// //     },
// //     // ... other mock properties
// //   ],
// //   Nairobi: [
// //     // ... other mock properties
// //   ],
// //   Lagos: [
// //     // ... other mock properties
// //   ],
// // };

// export function getPropertyById(id: number): Property | undefined {
//   for (const city of Object.keys(allPropertyData) as City[]) {
//     const found = allPropertyData[city].find((p) => p.id === id);
//     if (found) return found;
//   }
//   return undefined;
// }

// export function getAllProperties(): Property[] {
//   return (Object.keys(allPropertyData) as City[]).flatMap(
//     (c) => allPropertyData[c]
//   );
// }
