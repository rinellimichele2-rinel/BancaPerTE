# Banca Mobile

## Overview

Banca Mobile is a mobile banking application built with React Native and Expo, targeting Android and iOS platforms with Italian language interface. The app provides banking functionality including authentication, account balance viewing, transaction history, and common banking operations like transfers and payments.

The application follows a client-server architecture with an Express.js backend and PostgreSQL database for data persistence. It's designed to simulate a realistic banking experience with features like PIN-based authentication, transaction generation, and account management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack and bottom tab navigators
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: StyleSheet API with a centralized theme system in `client/constants/theme.ts`
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`

The app uses a modular structure:
- `client/screens/` - Screen components (WelcomeScreen, PinEntryScreen, HomeScreen, etc.)
- `client/components/` - Reusable UI components (Button, Card, ThemedText, etc.)
- `client/navigation/` - Navigation configuration
- `client/lib/` - Authentication context and API client
- `client/hooks/` - Custom React hooks

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints registered in `server/routes.ts`
- **Storage Layer**: `server/storage.ts` provides database abstraction

Key API capabilities:
- User authentication (login by username, PIN verification)
- Transaction management (create, list, generate random transactions)
- Balance updates

### Authentication Flow
1. User enters username on WelcomeScreen
2. Server creates or retrieves user, returns userId
3. User enters 5-digit PIN on PinEntryScreen
4. Server verifies PIN and returns full user data
5. Auth state persisted via AsyncStorage

### Database Schema
Defined in `shared/schema.ts`:
- **users**: id, username, pin, fullName, accountNumber, balance, cardLastFour, createdAt
- **transactions**: id, userId, description, amount, type, category, accountNumber, isContabilizzato, date, createdAt

Schema validation uses Drizzle-Zod for type-safe inserts.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management
- **pg**: Node.js PostgreSQL client

### Frontend Libraries
- **Expo modules**: expo-blur, expo-haptics, expo-linear-gradient, expo-image, expo-splash-screen
- **react-native-reanimated**: Animations
- **react-native-gesture-handler**: Touch handling
- **react-native-keyboard-controller**: Keyboard-aware components
- **@tanstack/react-query**: Data fetching and caching
- **@react-native-async-storage/async-storage**: Local persistence for auth tokens

### Development Tools
- **tsx**: TypeScript execution for server
- **drizzle-kit**: Database migrations and schema push
- **esbuild**: Server bundling for production

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: API server domain for client requests
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS`: Used for CORS configuration