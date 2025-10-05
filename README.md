# 🏡 Betkiray - Modern Real Estate Platform

[![License](https://img.shields.io/badge/license-UNLICENSED-blue.svg)](#license)
[![TypeScript](https://img.shields.io/badge/TypeScript-97.3%25-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue.svg)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-API-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-green.svg)](https://prisma.io/)

A comprehensive real estate platform built with modern technologies, featuring cross-platform mobile application and robust backend API. Betkiray enables users to browse, save, and interact with property listings while providing real-time chat functionality and comprehensive user management.

## 🌟 Features

### 📱 Mobile Application (React Native + Expo)
- **Property Browsing**: Discover and explore property listings with detailed information
- **Interactive Maps**: View properties on maps with location-based search
- **Real-time Chat**: Communicate with property owners and agents
- **User Profiles**: Comprehensive user profile management
- **Saved Properties**: Bookmark and manage favorite listings
- **Reviews & Ratings**: Rate and review properties and users
- **Authentication**: Secure login with Google OAuth integration
- **Cross-platform**: Runs on iOS, Android, and Web

### 🚀 Backend API (NestJS)
- **RESTful API**: Comprehensive REST endpoints with Swagger documentation
- **Real-time Communication**: WebSocket support for instant messaging
- **Database Management**: Prisma ORM with PostgreSQL
- **Authentication & Authorization**: JWT-based auth with Google OAuth
- **File Management**: Property image uploads and management
- **Admin Panel**: Administrative features for platform management
- **Security**: Input validation, password hashing, and secure endpoints

## 🏗️ Architecture

```
betkiray/
├── Betkiray_frontend/          # React Native (Expo) Mobile Application
│   ├── app/                    # App screens and navigation
│   ├── components/             # Reusable UI components
│   ├── contexts/               # React contexts for state management
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── assets/                 # Images, icons, and static assets
│   └── config/                 # App configuration
└── betkiray_backend/           # NestJS Backend API
    ├── src/
    │   ├── admin/              # Admin management module
    │   ├── auth/               # Authentication & authorization
    │   ├── chat/               # Real-time messaging
    │   ├── database/           # Database configuration
    │   ├── profile/            # User profile management
    │   ├── properties/         # Property listings CRUD
    │   ├── reviews/            # Reviews and ratings
    │   ├── saved/              # Saved properties functionality
    │   └── users/              # User management
    ├── prisma/                 # Database schema and migrations
    └── test/                   # Test suites
```

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based navigation
- **React Navigation** - Navigation library
- **Axios** - HTTP client for API calls
- **Socket.IO Client** - Real-time communication
- **React Native Maps** - Interactive maps
- **Expo Image Picker** - Media handling
- **AsyncStorage** - Local data persistence

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** - Modern database ORM
- **PostgreSQL** - Relational database
- **Socket.IO** - WebSocket implementation
- **Passport** - Authentication middleware
- **JWT** - JSON Web Tokens for auth
- **Google OAuth** - Third-party authentication
- **Swagger** - API documentation
- **bcrypt** - Password hashing

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Expo CLI (for mobile development)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/esayas-tesfaye/betkiray.git
   cd betkiray/betkiray_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3000`
   Swagger documentation at `http://localhost:3000/api`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd betkiray/Betkiray_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Configure your API endpoints and keys
   ```

4. **Start the Expo development server**
   ```bash
   npx expo start
   ```

5. **Run on your preferred platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your device

## 📱 Mobile App Features

### Core Functionality
- **Property Search**: Advanced filtering and search capabilities
- **Map Integration**: Location-based property discovery
- **User Authentication**: Secure login/signup with social auth
- **Profile Management**: Edit and manage user profiles
- **Favorites**: Save and organize preferred properties
- **Real-time Chat**: Instant messaging with property contacts
- **Reviews System**: Rate and review properties and users
- **Notifications**: Stay updated with important alerts

### Development Features
- **Hot Reloading**: Fast development with instant updates
- **Type Safety**: Full TypeScript coverage
- **Code Splitting**: Optimized bundle sizes
- **Testing**: Comprehensive test coverage
- **Linting**: ESLint configuration for code quality

## 🔧 API Endpoints

The backend provides comprehensive REST APIs:

- **Authentication**: `/auth/*` - Login, register, OAuth
- **Users**: `/users/*` - User management and profiles
- **Properties**: `/properties/*` - Property CRUD operations
- **Chat**: `/chat/*` - Real-time messaging
- **Reviews**: `/reviews/*` - Rating and review system
- **Saved**: `/saved/*` - Bookmark management
- **Admin**: `/admin/*` - Administrative functions

Full API documentation available via Swagger UI when running the backend.

## 🔐 Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/betkiray"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
PORT=3000
```

### Frontend (.env)
```bash
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

## 🧪 Testing

### Backend Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Testing
```bash
# Run tests
npm test

# Watch mode
npm test -- --watch
```

## 📦 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Start production server: `npm run start:prod`
3. Configure your production database and environment variables

### Mobile App Deployment
1. **EAS Build**: `eas build --platform all`
2. **App Store**: `eas submit --platform ios`
3. **Play Store**: `eas submit --platform android`
4. **Web**: `expo export:web`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is currently unlicensed. Please contact the repository owner for usage permissions.

## 👨‍💻 Author

**Esayas Tesfaye**
- GitHub: [@esayas-tesfaye](https://github.com/esayas-tesfaye)
- Project Link: [https://github.com/esayas-tesfaye/betkiray](https://github.com/esayas-tesfaye/betkiray)

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Amazing React Native platform
- [NestJS](https://nestjs.com/) - Powerful Node.js framework
- [Prisma](https://prisma.io/) - Excellent database ORM
- [React Navigation](https://reactnavigation.org/) - Navigation library
- All the open-source contributors who made this project possible

---

**⭐ Star this repository if you find it helpful!**
