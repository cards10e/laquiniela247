# La Quiniela 247 Bug Tracker

## Critical Bugs

### 1. Admin Panel - Users Screen Crash
- **Status**: Open
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: The Users screen in the Admin Panel crashes when accessed. "Application error: a client-side exception has occurred (see the browser console for more information)."
- **Additional Notes**: Screenshots of crash errors requested

### 2. Statistics Option Crash
- **Status**: Open
- **Priority**: High
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: Application crashes when accessing the statistics option
- **Additional Notes**: Screenshot provided in email

### 3. Logout Bug
- **Status**: Open
- **Priority**: High
- **Reported By**: Michael Jimenez
- **Date**: June 6, 2025
- **Description**: Potential logout issues when:
  - Switching between users
  - Ending testing sessions
- **Workaround**: Always ensure proper logout when switching users or ending testing

## UI/UX Bugs

### 1. Light/Dark Mode Toggle
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Jim Baskin
- **Date**: June 6, 2025
- **Description**: 
  - Mode toggle shows three states instead of two
  - Initial state is light
  - First toggle keeps it white
  - Second toggle changes to dark
- **Expected Behavior**: Should only have two states (light/dark)

### 2. Team Logo Visibility
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Logos not visible in light mode
  - Logo size too small for legibility
  - Logos getting lost with white background

### 3. Betting Window Size
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Betting window is too large
  - Should match square size of other elements

### 4. Game Time Selection UI
- **Status**: Open
- **Priority**: Low
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Minutes selection shows all minutes instead of just 00, 15, 30, 45
  - Games not properly grouped by week

## Feature Requests

### 1. Navigation Structure
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**: 
  - Change default landing page to Juegos screen
  - Make Juegos the leftmost navigation option
  - Remove Quick Actions section from Dashboard
  - Remove Dashboard and My History for admin users
  - Keep Games and Profile sections for admin
  - Implement hamburger menu for mobile navigation
  - Ensure all navigation elements are touch-friendly

### 2. Currency Support
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Add currency toggle between MXN (Mexican Pesos), USD (US Dollars), and Bitcoin
  - Display currency next to numbers instead of in middle
  - Implement fixed bet amount (200 pesos to win 2000) for weekly La Quiniela bets only
  - Ensure currency selector is mobile-friendly
  - Optimize number input for mobile devices
  - Implement proper Bitcoin decimal handling
  - Add Bitcoin wallet integration support
  - Implement dynamic currency display based on selected language

### 3. Betting Rules
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Implement one bet per week limit for La Quiniela weekly bets
  - Keep single game bets functionality with variable amounts
  - Add update result option in game management
  - Ensure betting interface is optimized for mobile screens
  - Make bet placement process touch-friendly
  - Clearly distinguish between weekly La Quiniela bets and single game bets
  - Implement proper validation to prevent multiple weekly bets

### 4. Team Display Enhancement
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Add team logos alongside team names
  - Consider dark background for logo visibility
  - Increase logo size for better visibility
  - Ensure logos scale properly on mobile devices
  - Optimize team display for smaller screens

### 5. Game Management
- **Status**: Open
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Group games by week
  - Show games within selected week range
  - Add update result functionality
  - Implement proper game scheduling
  - Optimize game list view for mobile devices
  - Ensure touch-friendly game selection

### 6. Logo Enhancement
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Improve La Quiniela 247 logo visibility on login page
  - Increase logo size in hero section
  - Enhance logo display in header/navigation
  - Implement SVG color inversion for better contrast
  - Ensure logo is properly visible in both light and dark modes
  - Add dark background option for logo container if needed
  - Optimize logo display for mobile devices
  - Ensure proper scaling on different screen sizes

### 7. Accessibility and Localization
- **Status**: Open
- **Priority**: High
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Implement localization files for Spanish and English
  - Ensure platform supports accessibility for blind users
  - Adhere to UX design standards for accessibility
  - Implement keyboard navigation support
  - Add screen reader compatibility
  - Ensure all interactive elements are keyboard accessible

### 8. User Verification and Payouts (Phase 2)
- **Status**: Planned
- **Priority**: Medium
- **Reported By**: Meeting Discussion
- **Date**: June 6, 2025
- **Description**:
  - Develop user verification workflow
  - Implement payout system
  - Add profile verification for payouts
  - Create admin tools for user account management
  - Implement user deactivation functionality
  - Add verification status tracking

## Test Credentials
- **Demo User**: demo@laquiniela247.mx / demo123
- **Admin User**: admin@laquiniela247.mx / admin123

---
*Last Updated: June 6, 2025* 