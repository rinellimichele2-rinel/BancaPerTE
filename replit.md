# EquisCash (Banca Mobile)

## Overview

EquisCash is a mobile banking application built with React Native and Expo, targeting Android and iOS platforms with Italian language interface. The app provides banking functionality including authentication, account balance viewing, transaction history, and common banking operations like transfers and payments.

The application follows a client-server architecture with an Express.js backend and PostgreSQL database for data persistence. It's designed to simulate a realistic banking experience with features like PIN-based authentication, transaction generation, and account management.

**Branding Note**: The home screen maintains a similar design aesthetic to professional banking apps for authenticity, while all other screens display the "EquisCash" branding. The AI advisor is named "Assistente EquisCash".

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
- AI Financial Advisor chatbot (powered by OpenAI via Replit AI Integrations)

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
- **conversations**: id, userId, title, createdAt (for AI advisor chat)
- **messages**: id, conversationId, role, content, createdAt (chat messages)

Schema validation uses Drizzle-Zod for type-safe inserts.

### AI Financial Advisor
- Located in `server/replit_integrations/chat/`
- Uses OpenAI via Replit AI Integrations (no API key required)
- Provides personalized financial advice in Italian
- Accessible from HomeScreen via "Consulente AI" quick action

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

## Security Features

### Anti-Cheat Protections
- **Server-side balance validation**: All balance checks are performed on the server using database values, never trusting client data
- **Transaction editing does NOT modify balance**: Users cannot manipulate their balance by editing transaction amounts
- **Transfer validation**: P2P transfers validate funds server-side, prevent self-transfers, and require integer amounts
- **Atomic transaction records**: Both sender and receiver get transaction records for audit trail

### Balance Modification Rules
- **Saldo Certificato (realPurchasedBalance)** can ONLY be changed by:
  1. Admin top-ups via admin panel
  2. P2P transfers between users
  3. Custom preset transactions (user-created presets)
- Auto-generated transactions only affect display balance, NOT Saldo Certificato
- Editing existing transactions only changes the transaction record, NOT the user's balance

### Custom Preset System
- Users can create custom expense/income presets in AltroScreen
- Presets are stored in PostgreSQL database (`user_custom_presets` table)
- When triggered, presets DEDUCT from `realPurchasedBalance` (Saldo Certificato)
- Transactions created by presets are marked as `isSimulated: false` (real transactions)
- System validates sufficient certified balance before allowing expense
- iOS cache-busting via timestamps ensures fresh data display

## Admin Panel Features (v2.0)
The admin panel at `/admin` now includes:
- **Ricariche**: Search users by @username and add balance
- **Utenti**: View all users with sorting (by balance or registration date), block/unblock users, edit balances directly
- **Scambi**: View all real (non-simulated) P2P transfers between users
- **Referral**: Manage referral bonus settings and view activation history

### User Management Capabilities
- Block/unblock users with optional reason
- Direct balance editing for anti-cheat corrections
- Sort users by balance (highest first) or registration date (newest first)
- View total recharged amount per user

## Future Plans (Planned for next month)
- **Recharge username**: Special username for PayPal.me payments (separate from display name)
- **Payment tracking**: Database table to track top-up requests and their status