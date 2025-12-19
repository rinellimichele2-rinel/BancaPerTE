# Design Guidelines: Banking Interface App

## Platform & Design System
- **Platform**: Android (Material Design principles)
- **Language**: Italian interface
- **Data Storage**: Server-based (NOT local files)

## Authentication Flow

### 1. Username Screen (Screenshot 1)
- Full-screen form with centered layout
- White background
- Bank logo at top center
- Single text input field for username
- Blue primary action button labeled "AVANTI" (Continue)
- No navigation header
- Clean, minimal design

### 2. PIN Entry Screen (Screenshot 2)
- Numeric keypad interface
- 4-digit PIN display circles at top
- Bank branding visible
- Standard numeric grid (1-9, 0) with delete function
- White background with subtle shadows on buttons

## Main Dashboard (Screenshots 3-6)

### Header
- **Top Right**: Help icon ("?") - Single tap generates random transactions
- **Color**: Teal/turquoise brand color (#00A19C approximate)
- **Safe Area**: Standard Android status bar spacing

### Balance Card
- Large, prominent card at top
- Displays "Saldo disponibile" (Available balance)
- Large numeric value with € symbol
- White text on teal gradient background
- Rounded corners (8-12px radius)

### Quick Action Grid (Screenshot 3)
- 2x3 grid of action buttons below balance card
- Each button contains:
  - Icon (SVG)
  - Label text below icon
- White background cards with subtle elevation
- Equal spacing between cards
- Actions visible: Ricarica (Reload), Bonifico (Transfer), Bollettini (Bills), Pagamenti (Payments), Carta (Card), Altro (Other)

### Transaction List
- Below quick actions
- "Ultime operazioni" (Recent operations) header
- List items show:
  - Left: Icon representing transaction type
  - Center: Transaction description and date/time
  - Right: Amount with +/- indicator and color coding (green for positive, red for negative)
- Divider lines between items

## Navigation Architecture
- **Type**: Bottom Navigation Drawer (hamburger menu)
- **Screens**: Multiple sections accessible via drawer menu

## Detailed Screens (Screenshots 7-15)

### Transaction Detail View
- Full transaction information
- Date, time, description
- Amount prominently displayed
- Category/type information
- Back arrow navigation in header

### Menu/Settings Screens
- List-based navigation
- Grouped sections with headers
- Icons left-aligned with menu items
- Chevron indicators for nested navigation
- Options include: Profile, Cards, Payments, Settings, Help

### Forms & Input Screens
- Clean, single-column layouts
- Input fields with subtle borders
- Primary action buttons at bottom
- Cancel/back options in header

## Color Palette
- **Primary**: Teal/Turquoise (#00A19C)
- **Background**: White (#FFFFFF)
- **Text Primary**: Dark gray/black
- **Text Secondary**: Medium gray
- **Success/Positive**: Green (#4CAF50)
- **Error/Negative**: Red (#F44336)
- **Card Shadows**: Subtle elevation (2-4dp)

## Typography
- **Headers**: Bold, 20-24sp
- **Body**: Regular, 14-16sp
- **Amounts**: Bold, 24-32sp
- **Labels**: Regular, 12-14sp
- Font: Roboto (Android standard)

## Iconography
- **Type**: SVG icons throughout
- **Style**: Line-based, simple, Material Design compatible
- **Size**: 24x24dp for standard icons, 32x32dp for prominent actions
- **Color**: Matching brand teal or contextual colors

## Layout Specifications
- **Spacing**: 8dp base unit
- **Card Padding**: 16dp
- **Screen Margins**: 16dp horizontal
- **Grid Gap**: 12-16dp
- **Button Height**: 48-56dp
- **Corner Radius**: 8-12dp for cards, 24dp for buttons

## Interaction Design
- **Touchable Feedback**: Material ripple effect
- **Help Button**: Single tap generates random transaction entries
- **Balance**: Editable/modifiable
- **Navigation**: Smooth transitions between screens
- **Form Submission**: Loading states for server communication

## Critical Requirements
1. **Exact Proportions**: Match screenshot layouts precisely
2. **Sequential Order**: Follow screenshot sequence exactly
3. **SVG Icons**: All icons must be SVG format
4. **Dynamic Buttons**: Generate from screenshot analysis
5. **Server Storage**: All data persists server-side
6. **Italian Language**: All UI text in Italian

## Accessibility
- Minimum touch target: 48x48dp
- Sufficient color contrast (4.5:1 minimum)
- Clear visual hierarchy
- Keyboard navigation support