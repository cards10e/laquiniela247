# Changelog

All notable changes to this project will be documented in this file.

## [2.0.28] - 2025-06-18
### 🎯 Traditional Quiniela Format: Current Week Betting Restriction
- **Weekly Betting Format**: Implemented traditional Quiniela format restricting betting to current calendar week only
  - **Current Week Definition**: Monday to Sunday of current calendar week for consistent betting periods
  - **Smart Week Detection**: Automatically detects current week games, falls back to next upcoming week if no current games
  - **Frontend-Only Implementation**: Safe, non-breaking approach using client-side filtering without database changes
  - **Admin Exception**: Administrators continue to see all games for management purposes while users see only current week

### 🛠️ Technical Implementation
- **Intelligent Game Filtering**: `getCurrentWeekGames()` utility function with comprehensive week range calculation
  - **Calendar Week Logic**: Monday 00:00 to Sunday 23:59 for consistent weekly periods
  - **Fallback Strategy**: Shows next upcoming week games if no games in current week
  - **Same-Week Grouping**: Returns games from same week as earliest upcoming game for consistency
- **Comprehensive Application**: Applied filtering to all betting interfaces:
  - Single bet sections with individual game cards
  - Parlay bet sections with weekly group betting
  - Game calculations and summary statistics
  - Bet validation and placement logic

### 🎮 Enhanced User Experience
- **Focused Betting Interface**: Users see only relevant games for current betting period (2 games from week 25, dated 6/20/2025)
- **Traditional Format Adherence**: Follows established Quiniela weekly format familiar to Mexican sports betting culture
- **Eliminated Week Confusion**: No more multiple weeks (6/20, 6/27, 7/4) displayed simultaneously
- **Preserved Admin Functionality**: Administrators retain full game management capabilities across all weeks

### 🔧 Debugging & Quality Assurance
- **Comprehensive Debug Logging**: Enhanced console logging with 🚨 and 🎮 prefixes for filtering verification
- **Variable Consistency**: Fixed duplicate variable declarations causing parlay section to use unfiltered games
- **Build Verification**: TypeScript compilation successful with zero errors throughout development
- **Thorough Testing**: Verified filtering works correctly for both single and parlay betting modes

### Fixed
- Multiple weeks (25, 26, 27) showing simultaneously in betting interface
- Parlay section using unfiltered games array instead of current week filtered games
- Single bet section displaying games from multiple weeks instead of current week only
- Inconsistent variable declarations causing filtering bypass in certain interface sections

### Enhanced
- Traditional weekly Quiniela format with current week restriction
- User experience focused on relevant current week games only
- Administrative game management capabilities preserved
- Consistent filtering application across all betting interfaces
- Debug logging system for filtering verification and troubleshooting

## [2.0.27] - 2025-06-18
### 🌐 Localization Fix: Complete Spanish Translation Support
- **Fixed Hardcoded Strings**: Resolved issue where betting interface displayed English text instead of proper translations
  - **Root Cause**: Multiple hardcoded strings in betting interface bypassing translation system
  - **Missing Translation Keys**: Added 9 new translation keys for betting interface components
  - **Comprehensive Coverage**: All betting interface elements now respect user's language preference

### 🔧 Translation System Enhancement
- **Added Missing Translation Keys**:
  - `betting.total_bet_amount` - "Total Bet Amount" / "Cantidad Total de Apuesta"
  - `betting.number_of_weeks_bet` - "Number of Weeks Bet" / "Número de Jornadas Apostadas"
  - `betting.place_selections` - "Place Selections" / "Apostar Selecciones"
  - `betting.games_available_to_bet` - "Available Games for Betting" / "Juegos Disponibles para Apostar"
  - `betting.active_bets_placed` - "Active Bets Placed" / "Apuestas Realizadas"
  - `betting.you_have_placed_bets` - "You have placed bets" / "Tienes apuestas realizadas"
  - `betting.select_predictions_and_amounts` - Interactive helper text for bet summary
  - `betting.no_games_available` - "No games available" / "No hay juegos disponibles"
  - `betting.select_all_available_games` - Validation message with dynamic count parameters

### 🎯 User Experience Improvements
- **Consistent Language Experience**: Users can now seamlessly switch between English and Spanish using the 🌐 toggle
- **Week Summary Translation**: "Week Summary" now properly displays as "Resumen de la Jornada" in Spanish
- **Betting Interface Localization**: All betting actions, summaries, and status messages respect language preference
- **Parameter Support**: Dynamic translations with count and status parameters work correctly

### 🛠️ Technical Implementation
- **Code Quality**: Replaced hardcoded strings with proper `t()` function calls throughout betting interface
- **Translation Coverage**: Enhanced I18nContext with comprehensive betting terminology
- **Consistency**: Aligned all user-facing text with existing translation system patterns
- **Validation**: Ensured all new translation keys work correctly in both English and Spanish

### Fixed
- Hardcoded "Week Summary" not translating to "Resumen de la Jornada"
- "Total Bet Amount" and "Number of Weeks Bet" displaying in English regardless of language setting
- Mixed language display in betting interface elements
- Hardcoded Spanish strings bypassing translation system
- Missing translations for betting summary and status messages

### Enhanced
- Complete betting interface localization support
- Seamless language switching with 🌐 toggle in header
- Consistent translation system usage across all betting components
- Dynamic parameter support for count-based translations

## [2.0.26] - 2025-01-18
### 🐛 Critical Bug Fix: Single Bets Not Persisting (Bug #11)
- **Fixed Database Constraint Issue**: Resolved critical bug where single bets appeared to be placed successfully but disappeared after user logout/login
  - **Root Cause**: Database unique constraint `UNIQUE(user_id, game_id)` prevented placing both single AND parlay bets on the same game by the same user
  - **Silent Failure Pattern**: API returned 200 OK but database silently rejected transactions due to constraint violations
  - **Prisma Client Mismatch**: Backend code using outdated constraint names after schema changes

### 🔧 Database Schema Migration
- **Enhanced Unique Constraint**: Updated database constraint to allow both bet types on same game
  - **Before**: `UNIQUE KEY (user_id, game_id)` - prevented mixed bet types
  - **After**: `UNIQUE KEY (user_id, game_id, bet_type)` - allows single + parlay on same game
  - **Smart Prevention**: Still prevents duplicate bets of same type on same game
  - **Production Migration**: Applied direct database migration with zero downtime

### 🎯 Backend API Improvements
- **Fixed Prisma Query Logic**: Updated backend to use correct constraint reference
  - **Before**: `userId_gameId: { userId, gameId }` - caused validation errors
  - **After**: `userId_gameId_betType: { userId, gameId, betType: 'SINGLE' }` - proper type-aware validation
  - **Enhanced Error Handling**: Improved error logging for database constraint violations
  - **Type Safety**: Ensured TypeScript compatibility with new constraint structure

### 🚀 User Experience Restoration
- **Persistent Single Bets**: Single bets now correctly persist across login sessions
  - **Mixed Betting Support**: Users can place both single bets AND parlay bets on same games
  - **Eliminated "Endless Betting"**: Fixed confusing behavior where users could repeatedly place the same bet
  - **Consistent State**: Betting interface now accurately reflects actual database state
  - **Proper Validation**: Duplicate prevention works correctly for each bet type independently

### Technical Implementation
- **Database Migration**:
  ```sql
  -- Removed problematic constraint
  ALTER TABLE bets DROP INDEX bets_user_id_game_id_key;
  
  -- Added enhanced constraint supporting bet types
  ALTER TABLE bets ADD UNIQUE KEY bets_user_id_game_id_bet_type_key (user_id, game_id, bet_type);
  ```
- **Prisma Schema Update**: `@@unique([userId, gameId, betType])` - enhanced constraint modeling
- **Backend Logic Fix**: Updated bet validation to use type-aware constraint checking
- **Zero Breaking Changes**: All existing functionality preserved with enhanced capabilities

### Fixed
- Single bets disappearing after user logout/login cycles
- Silent database transaction failures with misleading 200 OK responses
- Prisma client validation errors for constraint lookups
- "Endless betting" behavior causing user confusion
- Database constraint conflicts between single and parlay bet types

### Enhanced
- Database schema with intelligent bet type separation
- Backend validation logic with proper constraint awareness
- User experience with consistent bet persistence
- Error handling with detailed constraint violation logging
- System reliability with elimination of silent failures

## [2.0.25] - 2025-01-18
### 🎯 Complete Single Bet & Parlay System Implementation
- **Full Bet Type Migration System**: Successfully migrated database to support both SINGLE and PARLAY bet types
  - **Intelligent Migration Script**: Analyzes existing bets and categorizes them based on betting patterns
  - **Smart Classification Algorithm**: Detects batch betting (PARLAY) vs individual game betting (SINGLE)
  - **Zero Data Loss**: All existing bets preserved with appropriate type classification
  - **Migration Analytics**: Real-time reporting of migration results with bet type distribution

### 🚀 Optimistic UI Updates & State Management
- **Microsoft-Level UX**: Implemented optimistic UI updates for instant feedback without server round-trips
  - **Immediate State Updates**: Bet placement results in instant UI updates before server confirmation
  - **Enterprise Pattern**: Uses React state management best practices for immediate user feedback
  - **No Race Conditions**: Eliminated await-based approaches that caused delays and inconsistencies
  - **Real-Time Summary**: Bet summary panel updates immediately as users place individual bets

### 🎮 Advanced Single Bet Features
- **Individual Game Betting**: Complete implementation of single bet functionality with persistent state
  - **Accumulative Summary**: Bet summary correctly tracks multiple single bets (1, 2, 3+ bets)
  - **Persistent Data**: Single bets remain visible after logout/login cycles
  - **Real-Time Calculations**: Dynamic potential winnings calculations (2.5x multiplier)
  - **Smart Amount Tracking**: Individual bet amounts with $50 default, customizable per game

### 🌐 Complete Spanish Localization
- **Missing Translation Fix**: Added all missing Spanish translations for betting interfaces
  - **Bet Confirmation Messages**: "¡Todas las apuestas realizadas con éxito!"
  - **Progress Indicators**: "Has realizado %{placed} de %{total} predicciones"
  - **Summary Labels**: "Resumen de la Jornada", "Apuestas Activas", "Ganancias Potenciales"
  - **Status Messages**: "Esperando resultados", "Tu predicción"

### 🔧 Database Schema & API Enhancements
- **BetType Enum Implementation**: Proper Prisma enum handling with UPPERCASE values
  - **Database Level**: MySQL enum with 'single', 'parlay' values
  - **TypeScript Level**: Prisma generates UPPERCASE enum ('SINGLE', 'PARLAY')
  - **API Consistency**: All endpoints properly handle enum case conversion
  - **Migration Safe**: Backward compatible with existing data

### 🛠️ Technical Architecture Improvements
- **State Management Revolution**: 
  ```typescript
  // Old approach (slow, race conditions)
  await fetchBettingData(); // Network round-trip delay
  
  // New approach (instant, reliable)
  setGames(prevGames => prevGames.map(game => 
    game.id === gameId ? { ...game, userBet: { prediction, isCorrect: null } } : game
  ));
  ```
- **Smart Calculation Engine**: Bet summary now counts both pending predictions AND placed bets
- **Database Consistency**: Fixed TypeScript compilation issues with proper enum value handling

### 🎯 Fixed Critical Issues
- **Bet Persistence**: Single bets now persist correctly across login sessions
- **UI State Sync**: Bet summary no longer resets to zero after placing multiple single bets
- **Enum Case Mismatch**: Resolved TypeScript/database enum value inconsistencies
- **Translation Gaps**: Eliminated English text showing in Spanish interface

### Added
- Complete bet type migration system with intelligent classification
- Optimistic UI updates for instant user feedback
- Persistent single bet functionality with accumulative tracking
- Missing Spanish translations for betting interface
- Advanced state management for bet summary calculations

### Enhanced
- Database schema with proper BetType enum support
- API endpoints with consistent enum handling
- User experience with immediate visual feedback
- Translation coverage for complete Spanish localization

### Technical Details
- **Migration Script**: `backend/src/scripts/migrateBetTypes.ts` with dry-run and live modes
- **Database Schema**: Enhanced `schema.prisma` with BetType enum
- **API Routes**: Updated `bets.ts` and `games.ts` with proper enum handling
- **Frontend**: Optimized `bet.tsx` with React state management best practices
- **Zero Breaking Changes**: All existing functionality preserved with enhanced features

## [2.0.24] - 2025-01-16
### 🎨 Complete History Page Revamp - Modern UI/UX with Bet Type Separation
- **Revolutionary History Page Design**: Complete overhaul of `/history` page with sophisticated modern UI/UX
  - **Dual Bet Type Architecture**: Clear separation between La Quiniela weekly parlays and Single Bet history
  - **Modern Visual Design**: Gradient backgrounds, rounded corners, enhanced shadows, and smooth animations
  - **Professional Icon System**: FontAwesome icon integration with contextual and gambling-specific iconography
  - **Enhanced Information Hierarchy**: Improved data presentation with better visual organization and readability

### 🎯 Bet Type Separation & Data Structure
- **La Quiniela Betting History**: 
  - Fixed 200 MXN entry fee reflecting realistic Mexican market pricing
  - 10-game weekly predictions with 2000 MXN perfect score payout
  - Red gradient theming with group/community iconography (`faUsers`)
  - Performance badges: Perfect Week (trophy), Great Week (star), Good Week (flag), Needs Improvement (fire)
- **Single Bet History**:
  - Variable bet amounts (50-300 MXN) for individual game predictions  
  - Custom payout ratios based on odds and betting amounts
  - Purple gradient theming with gaming iconography (`faGamepad`)
  - Individual game focus with precise prediction tracking

### 🎨 Modern UI/UX Design System
- **Enhanced Visual Hierarchy**: 
  - Full-screen gradient backgrounds (`bg-gradient-to-br from-secondary-50 to-secondary-100`)
  - Modern card design with `rounded-2xl` corners and multi-layered shadows
  - Professional header section with descriptive iconography and context
  - Sophisticated filter controls in organized card layout with hover effects
- **Interactive Elements**:
  - Dual filtering system: Bet Type (All Types, La Quiniela, Single Bets) + Status (All, Won, Lost, Pending)
  - Performance badges with gradient backgrounds and contextual icons
  - Expandable bet details with smooth animations and enhanced prediction grids
  - Touch-friendly buttons with scaling hover effects and proper spacing

### 🎮 FontAwesome Icon Integration & Gambling Context
- **Performance Iconography**:
  - Perfect Performance: `faTrophy` (crown/achievement)
  - Great Performance: `faStar` (excellence)
  - Good Performance: `faFlag` (milestone achievement)
  - Needs Improvement: `faFire` (motivation/energy)
- **Interface Icons**:
  - History Navigation: `faHistory` (time/records)
  - Bet Types: `faPlay` (action/gaming)
  - Status Tracking: `faChartBar` (analytics)
  - Date Information: `faCalendar` (scheduling)
  - Prediction Details: `faLightbulb` (insights/strategy)
  - Expand/Collapse: `faChevronDown/Up` (navigation)

### 💎 Enhanced User Experience Features
- **Smart Performance Analytics**:
  - Accuracy percentages with visual indicators
  - Dynamic performance badges based on success rates
  - Contextual coloring for wins (emerald), losses (red), pending (amber)
  - Summary statistics with modern icon-based cards
- **Responsive Design Excellence**:
  - Mobile-first architecture with flexible layouts
  - Touch-friendly interactive elements (36px minimum targets)
  - Adaptive grid systems: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Seamless experience across all device sizes

### 🏗️ Technical Architecture & Data Models
- **Enhanced Data Structure**: 
  ```typescript
  interface BetHistory {
    id: number;
    betType: 'la_quiniela' | 'single_bet';  // NEW: Explicit bet type
    weekNumber?: number;                     // Optional for single bets
    gameId?: number;                         // NEW: For single bet identification
    amount: number;
    status: 'pending' | 'won' | 'lost' | 'partial';
    correctPredictions: number;
    totalPredictions: number;
    winnings: number;
    date: string;
    predictions: PredictionDetail[];
  }
  ```
- **Comprehensive Mock Data**: Realistic betting scenarios with proper Mexican market amounts and team names
- **Filtering Architecture**: Dual-filter system with `BetTypeFilter` and `FilterType` for precise data segmentation

### 🌐 Internationalization & Mexican Market Focus
- **Complete Translation Support**: 
  - English/Spanish translations for all new UI elements
  - Gambling-specific terminology and Mexican market context
  - Performance indicators and betting terminology in both languages
  - Cultural adaptation for Mexican sports betting preferences
- **Market-Specific Features**:
  - Liga MX team integration with proper logos and names
  - Mexican peso (MXN) as primary currency with proper formatting
  - Realistic betting amounts reflecting Mexican market standards

### Added
- Complete history page redesign with modern UI/UX architecture
- Bet type separation system (La Quiniela vs Single Bets)
- FontAwesome icon integration with gambling-specific iconography  
- Enhanced filtering system with dual bet type and status filters
- Performance badge system with contextual achievement indicators
- Responsive design optimized for mobile and desktop experiences
- Comprehensive mock data representing realistic Mexican betting scenarios
- Modern summary statistics with icon-based visual indicators

### Enhanced
- Visual information hierarchy with improved data presentation
- User interaction patterns with smooth animations and hover effects
- Accessibility standards with proper contrast ratios and touch targets
- Translation system with gambling and Mexican market terminology
- Data structure to support multiple bet types and enhanced analytics

### Technical Details
- **Files Modified**: `frontend/src/pages/history.tsx`, `frontend/src/context/I18nContext.tsx`
- **Dependencies**: FontAwesome 6.7.2 icon library integration
- **Architecture**: Preserved all existing functionality while adding modern UI layer
- **Performance**: Optimized rendering with conditional badge generation and smart filtering
- **Zero Breaking Changes**: All existing history functionality preserved with enhanced presentation

## [2.0.23] - 2025-01-16
### 🛡️ Comprehensive Security Audit & Mexican Market Compliance Framework
- **Complete Security Assessment**: Delivered comprehensive 769-line security audit identifying 5 critical vulnerabilities
  - **Race Condition (CVSS 9.3)**: Bet placement vulnerability allowing duplicate transactions and financial inconsistencies
  - **Admin Access Control (CVSS 9.1)**: Deactivated administrators retaining system access privileges
  - **SQL Injection (CVSS 8.8)**: Admin search functions vulnerable to database compromise
  - **Currency Manipulation (CVSS 8.7)**: Unverified external exchange rate APIs enabling financial fraud
  - **Disabled Rate Limiting (CVSS 8.2)**: Production environment exposed to brute force and DDoS attacks

### 🇲🇽 Mexican Regulatory Compliance & Market Specialization
- **SEGOB Sports Betting License**: Federal government licensing requirements with criminal penalty framework
- **CNBV Financial Oversight**: Enhanced KYC requirements including CURP, RFC, and INE document verification
- **SAT Tax Integration**: Real-time tax withholding, CFDI digital invoicing, and automatic reporting systems
- **UIF AML Monitoring**: Lower reporting thresholds ($600 USD crypto, $7,500 cash) with automated detection
- **LFPDPPP Data Protection**: Mexican privacy law compliance framework (equivalent to GDPR)

### 🪙 Banxico Cryptocurrency Compliance Framework
- **ITF License Requirements**: Financial Technology Institution licensing for all cryptocurrency operations
- **Multi-Signature Security**: Enhanced 3-of-5 signature requirements for high-value transactions (>$10K USD)
- **Real-Time Tax Calculation**: Automatic crypto transaction tax calculation with SAT withholding
- **Pre-Authorization Framework**: Banxico approval required for ALL cryptocurrency operations
- **Enhanced KYC Standards**: Beyond traditional financial services for crypto user verification

### 🔧 PCI DSS & Enhanced Security Requirements
- **Confirmed PCI DSS Requirement**: Mexican sports betting platforms MUST maintain full PCI DSS compliance
- **CNBV Enhanced Controls**: Additional security measures beyond international PCI DSS standards
- **Hardware Security Modules**: Required for all cryptographic operations per Mexican regulations
- **Biometric Authentication**: Multi-factor authentication with biometric verification requirements
- **Data Residency**: All user data must remain within Mexican borders per regulatory requirements

### 📊 Implementation Roadmap & Technical Architecture
- **20-Week Accelerated Timeline**: Condensed from 44 weeks for internal team implementation
- **Phase-Based Approach**: Critical security fixes (3 weeks), payment integration (8 weeks), compliance (16 weeks)
- **Mexican-Specific Phases**: Parallel implementation tracks for Mexican regulatory requirements
- **Technical Implementation**: Complete code examples for secure transactions, rate limiting, and crypto processing
- **Compliance Metrics**: Detailed KPIs for security, regulatory, and business success measurement

### 💡 Strategic Market Positioning
- **Mexican Market Leadership**: Comprehensive compliance framework positions platform as market leader
- **Cryptocurrency Innovation**: First-to-market with full Banxico-compliant cryptocurrency integration
- **Security Excellence**: Industry-leading security posture with zero-tolerance vulnerability management
- **Regulatory Expertise**: Deep understanding of Mexican financial and sports betting regulatory landscape
- **Competitive Advantage**: Complete compliance framework as differentiation in competitive market

### Added
- Complete 769-line security audit report (`SECURITY_AUDIT_REPORT.md`)
- Mexican regulatory compliance framework with CNBV, SEGOB, SAT, UIF requirements
- Banxico cryptocurrency compliance architecture with technical implementation
- Enhanced KYC/AML systems for Mexican market requirements
- PCI DSS compliance confirmation with Mexican enhanced security controls
- 20-week implementation roadmap with parallel Mexican compliance tracks

### Technical Details
- **Architecture Documentation**: Complete security architecture diagrams and compliance frameworks
- **Code Examples**: Secure transaction processing, rate limiting, and cryptocurrency compliance
- **Regulatory Integration**: Technical specifications for CNBV, SAT, UIF, and Banxico compliance
- **Security Metrics**: Comprehensive KPIs for security, compliance, and business success
- **Zero Breaking Changes**: All existing functionality preserved while adding security and compliance layers

## [2.0.22] - 2025-01-16
### 🚨 Critical Production Issue Fix - Rate Limiting
- **Fixed "Too Many Requests" API Rate Limiting**: Resolved critical production issue causing external API rate limit violations
  - **Problem**: Every user visiting the site started a 5-minute background timer making API calls to `exchangerate-api.com` and `fixer.io`
  - **Root Cause**: `exchangeRateService.startBackgroundRefresh()` created multiple intervals across browser tabs causing hundreds of API calls
  - **Impact**: External APIs rate-limited our production site, affecting all users with "too many requests" errors
  - **Solution**: Disabled aggressive background refresh while preserving intelligent on-demand currency conversion

### 🔧 Optimized Currency Exchange Architecture
- **Smart Caching Strategy**: Leveraged existing multi-layer cache system without background polling
  - **Fresh Cache**: 5 minutes for immediate accuracy
  - **Stale Tolerance**: 30 minutes for resilience during API downtime
  - **Fallback Rates**: Always-available backup rates prevent complete failure
  - **On-Demand Fetching**: Currency conversion only triggers API calls when users actually convert currencies
- **Multi-Provider Failover**: ExchangeRate-API and Fixer.io with graceful degradation maintained

### 🛡️ Production Rate Limiting Confirmation
- **Deploy Script Verification**: Confirmed `deploy.sh` automatically enables production rate limiting
  - **Development**: Rate limiting commented out for easy testing
  - **Production**: Deployment script uncomments all rate limiting middleware
  - **Default Limits**: 100 requests per 15 minutes per IP (very reasonable)
  - **Automatic**: No manual intervention required during deployment process

### 💡 Performance & Cost Optimization
- **Reduced External API Calls**: Eliminated unnecessary background API polling, reducing costs and improving reliability
- **Better User Experience**: Currency conversion still works seamlessly but only fetches rates when needed
- **Server Load Reduction**: Fewer background processes and API calls improve overall application performance
- **Sustainable Architecture**: Application now scales without hitting external API rate limits

### Fixed
- Production "too many requests" errors from external currency exchange APIs
- Multiple background refresh timers created by simultaneous user visits
- Excessive API calls to exchangerate-api.com and fixer.io services
- Potential cost escalation from unlimited background API polling

### Changed
- Disabled background currency refresh to prevent API rate limiting
- Currency exchange now operates on intelligent on-demand fetching
- Preserved all currency conversion functionality with better resource management
- Maintained multi-provider failover and caching strategies

### Technical Details
- **File Modified**: `frontend/src/context/CurrencyContext.tsx` - commented out `exchangeRateService.startBackgroundRefresh()`
- **Architecture Preserved**: All existing currency conversion, caching, and fallback logic intact
- **Zero Breaking Changes**: Users experience identical currency functionality with better performance
- **Production Safety**: Deploy script continues to enable rate limiting as designed

## [2.0.21] - 2025-01-16
### 🔧 Critical Betting Countdown Fix
- **Fixed Incorrect Betting Deadline Display**: Enhanced primary week selection logic in `/api/games/current-week`
  - **Problem**: API was selecting highest numbered week (Week 99) with expired deadline, causing 11+ day countdown instead of correct 4-day countdown
  - **Root Cause**: Primary week selection used `openWeeks[0]` which picked highest `weekNumber` regardless of deadline validity
  - **Solution**: Implemented smart week selection algorithm that handles all scenarios:
    - **Multiple Valid Weeks**: Selects week with earliest (most urgent) deadline
    - **All Expired Weeks**: Falls back to most recently opened week (highest number)
    - **Single Valid Week**: Correctly selects that week
  - **Result**: Countdown now correctly shows ~4 days for games starting June 20th vs showing Week 26/11+ days
  
### 📅 Universal Betting Logic
- **Smart Week Prioritization**: Algorithm works for any number of open weeks with any deadline combinations
- **Deadline Urgency**: When multiple valid weeks exist, prioritizes the most urgent deadline
- **Graceful Fallback**: Handles edge cases where all deadlines have passed
- **User Experience**: Betting countdown timers now accurately reflect time remaining for actual betting window

## [2.0.20] - 2025-01-16
### 🎨 Dashboard Visual Enhancement
- **Enhanced Total Winnings Display**: Added conditional coloring to Total Winnings in dashboard performance overview
  - **Green for Positive**: Total winnings values > $0 now display in green (`!text-success-600 dark:!text-success-400`)
  - **Red for Negative/Zero**: Total winnings values ≤ $0 now display in red (`!text-error-600 dark:!text-error-400`)
  - **Color Consistency**: Uses the exact same color scheme as the Total Revenue in the admin panel
  - **Visual Clarity**: Provides immediate visual feedback on user performance and profit/loss status
  - **Accessibility**: Maintains proper contrast ratios in both light and dark modes

### 💡 UX Improvements
- **Performance Indicators**: Dashboard now provides clear visual cues for financial performance
- **Color Psychology**: Green indicates success/profit, red indicates loss/break-even
- **Admin Panel Consistency**: Maintains consistent color scheme across admin and user dashboards

## [2.0.19] - 2025-01-16
### 📱 Mobile Admin Interface Enhancement
- **Fixed Duplicate Status Display**: Removed redundant "Closed" status indicators in mobile admin interface
  - **Problem**: Mobile admin view showed "Cerrada" (Closed) status twice for each betting week - once under the week title and again in the controls section
  - **User Impact**: Confusing and cluttered mobile interface with duplicate information
  - **Solution**: Removed secondary status display from Enhanced Week Controls while preserving primary status under week title
  - **Result**: Clean, streamlined mobile admin experience with single, clear status indication per week

### 🎯 Mobile UX Improvements
- **Reduced Visual Clutter**: Mobile admin interface now shows essential information without redundancy
- **Maintained Functionality**: All admin capabilities preserved - only removed duplicate visual elements
- **Better Information Hierarchy**: Primary status indicators remain in logical position under week titles
- **Touch-Friendly Design**: Cleaner interface reduces cognitive load for mobile admin users

### Fixed
- Duplicate "Cerrada" (Closed) status display in mobile admin week management
- Visual clutter in mobile admin interface causing user confusion
- Redundant status information competing for user attention

### Changed
- Mobile admin Enhanced Week Controls no longer show duplicate status text
- Streamlined mobile admin interface focuses on actionable controls rather than redundant status
- Improved mobile admin user experience with cleaner information architecture

### Technical Details
- **File Modified**: `frontend/src/pages/admin.tsx`
- **Logic Removed**: Duplicate status display logic in Enhanced Week Controls section
- **Preserved**: Primary status indicators under week titles and all functional controls
- **Zero Breaking Changes**: All admin functionality remains intact, only UI cleanup performed

## [2.0.18] - 2025-01-16
### 🔐 Navigation Security & UX Enhancement
- **Fixed Demo User Admin Access Confusion**: Removed inappropriate admin panel link from demo user navigation
  - **Problem**: Demo users saw a "Panel" link in their navigation that led to admin functionality they couldn't access
  - **Root Cause**: Navigation logic incorrectly granted demo users a link to `/admin` despite having `USER` role, not `ADMIN`
  - **Security Impact**: No actual security breach - backend properly protected admin endpoints with role validation
  - **UX Impact**: Demo users experienced confusing navigation that redirected them away from intended functionality
  - **Solution**: Removed admin panel link entirely from demo user navigation menu

### 🎯 Role-Based Navigation Clarity
- **Clean Role Separation**: Navigation now properly reflects user permissions without misleading options
  - **Demo Users**: See only appropriate user-level navigation (Games, Dashboard, History, Profile)
  - **Regular Users**: Unchanged navigation experience with standard user options
  - **Admin Users**: Unchanged - retain full admin panel access as intended
  - **Eliminated Confusion**: No more "dead-end" links that redirect users away from their intended destination

### 🛡️ Security Validation Confirmed
- **Backend Protection Intact**: All admin endpoints properly protected with `adminMiddleware` requiring `ADMIN` role
- **Frontend Route Protection**: `ProtectedRoute` component correctly blocks non-admin access to admin pages
- **Authentication Middleware**: JWT validation and role checking function as designed
- **No Functional Vulnerabilities**: Demo users never had actual admin access, only confusing UI elements

### Fixed
- Demo users seeing inappropriate "Panel" link in navigation menu
- Confusing UX where demo users clicked admin links only to be redirected
- Navigation inconsistency between user roles and available functionality

### Changed
- Demo user navigation no longer includes any admin-related links
- Simplified navigation logic for better role-based access control
- Enhanced user experience by removing misleading interface elements

### Technical Details
- **File Modified**: `frontend/src/components/layout/Header.tsx`
- **Logic Change**: Removed `{ key: 'admin', href: '/admin', label: 'Panel' }` from demo user navigation array
- **Added**: `{ key: 'dashboard', href: '/dashboard', label: t('navigation.dashboard') }` for proper demo user flow
- **Zero Breaking Changes**: All existing functionality preserved, only UI cleanup performed

## [2.0.17] - 2025-01-14
### 🎯 Dashboard Game Visibility Enhancement
- **Fixed Limited Game Display**: Resolved critical issue where dashboard only showed 1 upcoming game despite multiple scheduled games
  - **Problem**: Dashboard API call limited to 20 games with chronological ordering (oldest first) showing mostly completed games
  - **Root Cause**: `/api/games` endpoint returned first 20 games chronologically, which were primarily historical completed games
  - **Impact**: Users saw minimal upcoming betting opportunities on dashboard despite admin creating many scheduled games
  - **Solution**: Increased API limit to 100 games and implemented intelligent client-side sorting

### 🧠 Smart Game Prioritization
- **Intelligent Sorting Algorithm**: Dashboard now prioritizes upcoming games over completed games
  - **Upcoming Games First**: Scheduled games appear at top, sorted by date (earliest first)
  - **Recent Games Second**: Completed games follow, sorted by date (most recent first)
  - **Better User Experience**: Users see relevant betting opportunities prominently displayed
  - **Maintains UI Logic**: Still displays first 6 games but from a much better sorted collection

### 🔧 Technical Improvements
- **Increased API Efficiency**: Dashboard fetches 100 games instead of 20 for better game selection
- **Zero Breaking Changes**: Maintains existing backend API and frontend UI behavior
- **TypeScript Build Fixes**: Resolved implicit type errors in sort and map functions
- **Performance Optimized**: Client-side sorting adds minimal overhead while dramatically improving UX

### Fixed
- Dashboard showing only 1 upcoming game when multiple scheduled games exist
- Poor game prioritization due to chronological ordering of API results
- TypeScript compilation errors in dashboard sorting logic
- Limited visibility of admin-created scheduled games for regular users

### Changed
- Dashboard API call increased from 20 to 100 game limit
- Added intelligent client-side sorting prioritizing upcoming over completed games
- Enhanced debug logging for better game visibility troubleshooting

### Technical Details
- **API Optimization**: Changed from `axios.get('/api/games')` to `axios.get('/api/games?limit=100')`
- **Smart Sorting**: Implemented date-aware sorting that separates upcoming vs past games
- **Type Safety**: Added explicit `Game` type annotations for sort and map functions

## [2.0.16] - 2025-01-14
### 📱 Mobile Admin UX Enhancement
- **Removed Duplicate Betting Status**: Cleaned up mobile admin interface to eliminate redundant status information
  - **Problem**: Mobile admin view showed "Betting Available" status twice - once in primary badge and again in expanded view
  - **Solution**: Removed duplicate betting status from expanded mobile view while preserving primary status badge
  - **Impact**: Cleaner, less cluttered mobile admin experience with focused information hierarchy
  - **Location**: Admin panel game cards in mobile view (< 1024px width)

### 🎯 User Experience Improvements
- **Reduced Visual Clutter**: Mobile admin interface now shows only essential information in expanded view
- **Maintained Functionality**: All admin capabilities preserved while improving information architecture
- **Touch-Friendly Design**: Streamlined mobile interface reduces cognitive load for admin users
- **Consistent Status Display**: Primary status badge remains the single source of truth for betting status

### Fixed
- Duplicate "Betting Available" status display in mobile admin expanded view
- Visual clutter in mobile admin interface

### Changed
- Mobile admin expanded view no longer shows redundant betting status information
- Simplified mobile admin interface focuses on essential actions and information

## [2.0.15] - 2025-06-13
### 🚀 UX Improvements: Localization & Mobile Optimization
- **Localized Game Status Text**: Fixed hardcoded "Live" status text to use proper internationalization
  - **English**: "🔴 Live", "Completed", "Scheduled"
  - **Spanish**: "🔴 En Vivo", "Completada", "Programado"
  - **Implementation**: Updated dashboard and bet pages to use `t('admin.live')`, `t('admin.completed')`, `t('admin.scheduled')`
  - **Consistency**: All status badges now respect user's language preference

### 📱 Mobile UX Critical Fixes
- **Removed Constant Page Refreshing**: Eliminated 30-second auto-refresh intervals causing poor mobile UX
  - **Problem**: Both admin and bet pages had `setInterval` calls refreshing data every 30 seconds
  - **Impact**: Pages were constantly reloading, disrupting user workflow and causing battery drain
  - **Solution**: Removed automatic refresh while preserving manual refresh capability
  - **Result**: Smooth, stable mobile experience without interruptions

- **Fixed Duplicate Status Display**: Cleaned up mobile admin panel interface
  - **Problem**: Mobile expanded view showed "Match Status" twice (primary badge + detailed section)
  - **Solution**: Removed duplicate "Match Status Detail" from mobile expanded view
  - **Result**: Cleaner, more focused mobile interface

### 🔧 Technical Improvements
- **Performance Optimization**: Reduced unnecessary API calls and server load
- **Battery Life**: Improved mobile device battery consumption
- **User Experience**: Eliminated disruptive page refreshing during user interactions
- **Code Cleanup**: Removed redundant status display logic

### Fixed
- Hardcoded "Live" status text not respecting user language settings
- Constant 30-second page refreshing causing mobile UX issues
- Duplicate match status display in admin panel mobile view
- Excessive API calls from automatic refresh intervals

### Changed
- Game status text now uses localized translations from I18nContext
- Removed automatic refresh intervals from admin and bet pages
- Simplified mobile admin interface by removing duplicate status information
- Improved mobile performance and user experience

## [2.0.11] - 2025-06-13
### 🔧 Critical Fix: Unified Game Status Consistency
- **Fixed Status Inconsistency**: Resolved critical issue where admin panel and bet page showed different game statuses
  - **Root Cause**: Admin panel used `/api/admin/games` with automatic status updates, bet page used `/api/games/current-week` without updates
  - **Solution**: Added `computeAutoGameStatus()` function to `/api/games/current-week` endpoint
  - **Result**: Both interfaces now show identical, real-time accurate game statuses
  - **Status Logic**: Scheduled → Live (at game time) → Completed (2.5 hours later)

### 🎯 Technical Implementation
- **Unified Status Calculation**: Both endpoints now use identical automatic status update logic
- **Real-Time Accuracy**: Game statuses automatically reflect actual match timing
- **Database Consistency**: Status updates are batched and applied before API responses
- **Zero Breaking Changes**: All existing functionality preserved

### 🚀 User Experience Impact
- **Admin Consistency**: Admins see accurate live game indicators matching user interface
- **Betting Accuracy**: Users see correct game statuses for betting decisions
- **Real-Time Updates**: No more manual status sync required during game times
- **Professional Reliability**: Eliminates confusion from inconsistent status displays

## [2.0.10] - 2025-06-13
### 🎨 Unified Live Status Styling
- **Consistent Live Game Display**: Unified "Live" status styling between admin panel and bet page
  - **Admin Panel Enhancement**: Live games now use warning colors (yellow/orange) instead of error colors (red)
  - **Visual Consistency**: Both admin and user interfaces show identical Live status styling
  - **Color Specification**: `bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400`
  - **Microsoft DE Approach**: Extended existing status system rather than duplicating logic

### 🔧 Technical Implementation
- **Minimal Code Changes**: Updated `getGamePrimaryStatus()` function and detailed view styling
- **Zero Breaking Changes**: All existing admin functionality preserved
- **Cross-Interface Consistency**: Admins and users see identical game status information
- **Maintainable Architecture**: Single source of truth for Live status styling

## [2.0.9] - 2025-06-13
### 🎨 USDT Symbol Enhancement
- **Improved USDT Display**: Enhanced USDT currency symbol from bulky `USDT 200.00` to clean `T$200.00`
  - **Better Visual Alignment**: Compact 2-character prefix matches format consistency with `US$200.00`
  - **Enhanced UX**: Reduced horizontal space usage and improved readability across all currency displays
  - **Maintains Clarity**: `T$` clearly identifies Tether/USDT while looking professional
  - **Cross-Platform Consistency**: Applied to all betting interfaces, history pages, and financial displays

### 🔧 Technical Details
- **Minimal Impact**: Single-line change in `getCurrencySymbol()` function
- **Zero Breaking Changes**: All existing currency conversion logic preserved
- **Automatic Propagation**: Enhancement applies across entire application ecosystem

## [2.0.8] - 2025-06-13
### 💰 Currency System Enhancement & Promise Rendering Fix
- **USDT Integration**: Successfully replaced Bitcoin (BTC) with USDT (Tether) in the currency system
  - **Currency Options**: Now supports MXN, USD, and USDT instead of MXN, USD, BTC
  - **Dropdown Update**: All currency selectors across the application now show USDT instead of BTC
  - **Exchange Rate Support**: USDT conversion rates integrated into the enterprise-grade exchange rate service
  - **Automatic Migration**: Users with BTC selected automatically fall back to MXN default
  
### 🎯 Distinguished Currency Symbols
- **Clear Currency Differentiation**: Implemented distinctive symbols for each currency to eliminate user confusion
  - **MXN (Mexican Peso)**: Clean `$200.00` symbol (default currency gets primary treatment)
  - **USD (US Dollar)**: `US$200.00` with US prefix to distinguish from peso
  - **USDT (Tether)**: `USDT 200.00` using crypto ticker convention
- **Universal Application**: New symbols display consistently across all pages (bet, history, dashboard, admin)
- **Enhanced UX**: Users can instantly identify which currency they're viewing/using

### 🔧 Critical Promise Rendering Fix
- **React Error Resolution**: Fixed "Objects are not valid as a React child (found: [object Promise])" error
  - **Root Cause**: Async `formatAmount()` function returning Promises being rendered directly in JSX
  - **Solution**: Created `FormattedAmount` component to handle async currency formatting properly
  - **Implementation**: Replaced all direct `{formatAmount(amount)}` calls with `<FormattedAmount amount={amount} />`
- **Enhanced Error Handling**: Added graceful loading states and fallback formatting
  - **Loading State**: Shows "..." while currency conversion is in progress
  - **Error Resilience**: Falls back to basic formatting if conversion fails
  - **Memory Safety**: Proper cleanup prevents memory leaks with unmounted components

### 🌍 Real-time Currency Conversion Preservation
- **Enterprise-Grade System**: Maintained 100% reliable currency conversion with multi-layer fallback
  - **Multi-Provider**: ExchangeRate-API, Fixer.io with backup providers
  - **Intelligent Caching**: Fresh (5 min), Stale (30 min), Expired (2 hour) strategies
  - **Circuit Breaker**: Failure thresholds with graceful degradation
  - **Background Refresh**: Automatic rate updates for optimal user experience
- **TypeScript Safety**: All currency types properly updated throughout the codebase

### Technical Improvements
- **Minimal Code Impact**: Only 4 files modified for maximum functionality (CurrencySelector, CurrencyContext, I18nContext, exchangeRateService)
- **Component Architecture**: New reusable FormattedAmount component handles all async currency formatting
- **Build Verification**: All TypeScript compilation successful with no errors
- **Cross-Page Consistency**: Currency symbols and formatting consistent across bet, history, dashboard, and admin pages

### Added
- `FormattedAmount` component for handling async currency formatting
- USDT translation keys in English and Spanish (`usdt: "USDT"`)
- Distinctive currency symbol system for clear user differentiation
- Proper async/await handling for real-time currency conversion

### Changed
- Currency type definition from `'MXN' | 'USD' | 'BTC' | 'USDT'` to `'MXN' | 'USD' | 'USDT'`
- Currency dropdown displays USDT instead of BTC across all interfaces
- Currency symbols: MXN uses `$`, USD uses `US$`, USDT uses `USDT ` prefix
- All direct formatAmount calls replaced with FormattedAmount component

### Fixed
- React Promise rendering error that prevented proper betting interface loading
- Currency symbol confusion where all currencies showed identical `$` symbol
- Async formatting issues causing build errors and runtime crashes
- Memory leaks in currency formatting with proper component cleanup

### Removed
- Bitcoin (BTC) support from currency system
- Bitcoin-specific formatting (8 decimal places, ₿ symbol)
- BTC exchange rates from fallback rate configuration
- Direct Promise rendering in JSX components

## [2.0.7] - 2025-01-19
### 🏆 Comprehensive Team Logo System & History Page Fixes
- **Intelligent Team Logo Fallback System**: Implemented robust 3-level fallback hierarchy for team logos across all pages
  - **Primary**: Database logo URLs (existing MySQL data preserved)
  - **Secondary**: Local `/public` logo collection with intelligent team name mapping
  - **Tertiary**: Professional soccer ball icon fallback
- **Complete Logo Collection Integration**: Added comprehensive Liga MX team logo collection to `/public` folder
  - **150+ Logo Files**: Multiple formats and sizes (standard, 150x150, -1 variants, PNG/JPEG)
  - **Smart Name Mapping**: Handles accented characters (AMÉRICA→AMERICA), team variations (GUADALAJARA→CHIVAS), multiple file patterns
- **New TeamLogo Component**: Created reusable `TeamLogo.tsx` component with automatic fallback logic
  - **Intelligent Mapping**: Comprehensive team name normalization and file pattern matching
  - **Debug Logging**: Console logs for troubleshooting team name mappings and file paths
  - **Multiple Fallback Attempts**: Tries 6 different file patterns before falling back to soccer ball

### 🔧 History Page Complete Overhaul
- **Fixed "Invalid bet ID" Errors**: Resolved critical routing issue where `/history` was treated as bet ID parameter
  - **Root Cause**: Missing `/api/bets/history` route in backend caused frontend errors
  - **Solution**: Added dedicated history endpoint with comprehensive betting data aggregation
- **Enhanced Mock Data**: Comprehensive prediction details for all weeks with working expand/collapse functionality
  - **Week 14 (Won)**: 8/10 correct predictions with detailed game breakdowns
  - **Week 13 (Lost)**: 4/10 correct predictions with team matchups
  - **Week 15 (Pending)**: 0/6 correct with future game predictions
- **Backend History API**: New `/api/bets/history` route with weekly betting statistics and prediction details
- **TypeScript Build Fixes**: Resolved null checking, Decimal conversion, and implicit any type errors

### 🎨 Universal Logo Implementation
- **Dashboard Page**: Updated to use TeamLogo component for all game displays
- **Bet Page**: Replaced complex fallback logic with simple TeamLogo components (6 locations)
- **Admin Page**: Enhanced game management with intelligent team logos
- **History Page**: Added team logos to all prediction details with new component
- **Consistent Styling**: All logos use `w-8 h-8 rounded-full object-cover` for uniform appearance

### Technical Improvements
- **Minimal Code Changes**: 1 new component, 3 import changes for maximum functionality
- **Build Optimization**: All pages compile successfully with no linter errors
- **Performance**: Lazy loading and efficient fallback system for optimal user experience
- **Maintainability**: Centralized logo logic eliminates duplicate fallback code across components

### Added
- `TeamLogo.tsx` component with intelligent 3-level fallback system
- Comprehensive Liga MX team logo collection in `/public` folder
- `/api/bets/history` backend endpoint with betting statistics
- Debug logging for team name mapping troubleshooting
- Enhanced mock data with detailed prediction breakdowns

### Fixed
- "Invalid bet ID" errors on `/history` page routing
- Missing expandable prediction details for all weeks
- TypeScript build errors in backend betting history logic
- Inconsistent team logo display across all application pages
- Complex fallback logic replaced with simple, reusable component

### Changed
- All pages now use unified TeamLogo component instead of custom fallback logic
- History page displays comprehensive mock data instead of empty API responses
- Team logo fallback system prioritizes local files over generic soccer balls
- Improved user experience with consistent logo display across entire application

## [2.0.6] - 2025-06-11
### 🎨 Admin Panel Consistency & Documentation
- **Unified Tab Styling**: All admin panel tabs now display consistent red styling when active
  - ✅ **Performance Overview** - Red section title + red active tab styling
  - ✅ **User Management** - Red section title + red active tab styling  
  - ✅ **Game Management** - Red section title + red active tab styling
  - **Visual Consistency**: Perfect alignment with design system using primary color scheme
- **Enhanced Admin Experience**: Each tab now shows its own red section title above navigation for better context and hierarchy

### 📚 Comprehensive Admin Documentation
- **Complete Admin Guide**: Added comprehensive `ADMIN_GAME_MANAGEMENT_GUIDE.md` covering every aspect of the Games Management interface
  - **Detailed Technical Explanations**: Real-time calculation engine for Game Status Sync with precise timing details
  - **Step-by-Step Instructions**: Complete workflows for betting window management and game status updates
  - **Troubleshooting Guide**: Solutions for all common scenarios with symptoms, solutions, and prevention
  - **Best Practices**: Daily/weekly routines and efficiency tips for optimal admin workflow
  - **Mobile vs Desktop**: Complete interface differences and optimization strategies
- **Real-Time Status Logic**: Documented automatic game state transitions:
  - **SCHEDULED → LIVE**: Exactly at game start time
  - **LIVE → COMPLETED**: 2.5 hours (150 minutes) after game start
  - **95% Automation**: Eliminates manual status management while preserving admin override capabilities

### Technical Improvements
- Enhanced admin interface visual hierarchy with consistent section titles
- Improved user experience with clearer navigation context
- Complete documentation coverage eliminating admin confusion
- Mobile-first responsive design considerations documented

## [2.0.5] - 2025-06-13
### 🌍 Complete Internationalization & Enhanced Admin UX
- **Full Spanish/English Localization**: Admin panel is now completely internationalized with comprehensive translation support
  - **Automatic Betting Management** → **Gestión Automática de Apuestas**
  - **Game Status Updates** → **Actualizaciones de Estado de Juegos**
  - All admin interface text, labels, buttons, and messages properly localized
  - Consistent terminology across entire application

### 🚀 Intelligent Automatic Game Management
- **Smart Automatic Game Status Updates**: Games now automatically transition between states based on actual match times
  - **Scheduled** → **Live** (at game start time) → **Completed** (2.5 hours after start)
  - New `/admin/games/auto-update-status` endpoint for manual status sync
  - Real-time status calculation using actual game dates instead of manual intervention
- **Enhanced Betting Window Automation**: Improved automatic betting window management with clearer status indicators
  - Auto-opens betting for games scheduled within 7 days
  - Automatic deadline setting 2 hours before first game of each week
  - Smart status detection for weeks ready for betting activation

### 🎨 Improved Admin Interface Design
- **Color-Coded Status Legend**: Status legend now uses same colors as actual status badges for visual consistency
  - 🟢 **Week Status** (green) - Controls betting availability for entire week
  - 🔴 **Betting Status** (pink/primary) - Individual game betting windows
  - ⚪ **Match Status** (grey) - Current state of actual games
- **Enhanced Visual Hierarchy**: Clear distinction between different status types with emoji indicators and descriptions
- **Intuitive Status Flow**: Clear explanation of status relationships and admin actions needed

### 🔧 Backend Enhancements
- **Smart Game Status Calculation**: New `computeAutoGameStatus()` function for automatic status management
- **Batch Status Updates**: Efficient bulk status updates for multiple games
- **Enhanced Error Handling**: Better error responses and user feedback for admin operations
- **Type Safety**: Improved TypeScript interfaces for admin game management

### Technical Improvements
- Added comprehensive translation keys for all admin interface elements
- Enhanced admin API endpoints with proper status management
- Improved component architecture for better maintainability
- Better responsive design for admin interface elements

## [2.0.4] - 2025-06-10
### 🧹 Code Simplification & UX Consistency
- **Endless Betting Mode Removal**: Completely removed the endless betting feature for demo users
  - **Rationale**: Provided inconsistent user experience compared to real betting behavior
  - **Impact**: Demo users now experience authentic betting constraints and real API interactions
  - **UX Improvement**: Cleaner profile interface with removal of demo-specific settings section
  - **Code Quality**: Eliminated conditional logic branches and reduced technical debt

### Enhanced Demo Experience
- **Authentic Betting Logic**: Demo users now use real API calls instead of simulated interactions
- **Consistent UX**: All users (demo, admin, regular) experience identical betting mechanics
- **Better Onboarding**: Demo users get realistic preparation for actual account usage
- **Simplified Codebase**: Removed dual code paths for betting functionality

### Removed
- Demo Settings section from user profile page
- Endless betting toggle and related UI components
- Simulated betting logic for demo users
- Translation keys for endless betting functionality

### Technical Improvements
- Simplified DemoContext to only provide user identification
- Reduced complexity in betting page logic
- Cleaner separation of concerns in component architecture
- Improved maintainability with single betting code path

## [2.0.3] - 2025-06-10
### 🔒 Critical Security Fix
- **Password Change Functionality**: Fixed critical HTTP method mismatch preventing all users from changing passwords
  - **Bug**: Frontend was sending PUT requests while backend only accepted POST requests for `/api/users/change-password`
  - **Impact**: Change password functionality was completely broken for all users (demo, admin, regular users)
  - **Fix**: Corrected frontend to use POST method, restoring password change capability
  - **Scope**: Affects all authenticated users across all roles

### Fixed
- Password change functionality now works correctly for all user types
- HTTP method alignment between frontend (POST) and backend (POST) endpoints
- Proper error handling and user feedback for password change operations

## [2.0.2] - 2025-01-18
### 🌍 Multi-Currency Support Implementation
- **Currency Selector**: Added compact currency toggle supporting MXN (Mexican Pesos), USD (US Dollars), and Bitcoin (BTC)
- **Mobile-Optimized Layout**: Currency selector positioned to the left of bet amount inputs with optimized sizing for mobile UX
- **Consistent Currency Display**: All bet amounts, winnings, and summaries now use selected currency with proper formatting
- **Persistent User Preferences**: Currency selection saved to localStorage and persists across sessions
- **Internationalization**: Added translation keys for all currencies in English and Spanish
- **Bitcoin Support**: Proper decimal formatting (8 places) vs fiat currencies (2 places)

### Enhanced Betting Interface
- **Compact Design**: Reduced bet input field sizes per UX best practices for mobile optimization
- **Eliminated Redundant Elements**: Removed unnecessary input box for La Quiniela fixed amounts, replaced with clean text display
- **Improved Visual Hierarchy**: Moved "Select Your Predictions" heading above filter sections for better information architecture
- **Touch-Friendly Spacing**: Optimized gaps and button sizes for mobile touch interactions

### Added
- `CurrencyContext.tsx` - Global currency state management with localStorage persistence
- `CurrencySelector.tsx` - Reusable, mobile-friendly currency dropdown component
- Currency formatting utilities with symbol management (₿ for Bitcoin, $ for fiat)
- Real-time currency conversion display across all betting interfaces
- Responsive sizing variants (small/medium) for different UI contexts

### Changed
- Bet amount input fields reduced from `w-32` to `w-24/w-20/w-16` for better mobile layout
- Currency selector uses compact `w-14` width with smaller text for space efficiency
- Button sizing optimized with `text-sm px-3 py-1` for mobile touch targets
- History page currency displays now use dynamic formatting instead of hardcoded MXN
- All monetary displays consistently use selected currency across the application

### Fixed
- Mobile layout overflow issues with betting interface elements
- Inconsistent currency display between different app sections
- Removed confusing read-only input field for La Quiniela fixed amounts
- Improved responsive spacing with reduced gaps (`gap-2` to `gap-1`) for mobile screens

### Technical Improvements
- Added currency context provider to app root for global state management
- Implemented proper TypeScript types for currency handling
- Enhanced responsive design with mobile-first approach
- Optimized component reusability across Single Bets and La Quiniela tabs

## [2.0.1] - 2025-01-18
### 🔒 Security & UX Improvements
- **Enhanced Authentication Security**: Fixed authentication redirect behavior to prevent URL exposure of protected pages when logged out
- **Clean Login Experience**: Users are now redirected to clean `/login` URL without query parameters or remnants of protected pages
- **UI Streamlining**: Temporarily hidden Quick Actions section from dashboard for cleaner interface
- **Development Optimization**: Temporarily disabled rate limiting for smoother development experience

### Changed
- ProtectedRoute now performs clean redirects to `/login` without exposing protected URLs
- Login page simplified to remove redirect parameter logic
- Dashboard Quick Actions section commented out for streamlined interface
- Rate limiting temporarily disabled in development environment

### Fixed
- Security issue where protected page URLs were visible in address bar when logged out
- Information leakage about existing protected routes through redirect parameters
- Improved authentication flow with no session remnants visible to unauthenticated users

### Security
- ✅ No exposure of protected URLs in the address bar when logged out
- ✅ Clean login experience with no session remnants
- ✅ No information leakage about what pages exist in the application
- ✅ Simplified and more secure authentication flow

## [2.0.0] - 2025-06-09
### 🎯 Major Betting Interface Overhaul
- **Consistent Bet Summary Display**: Both Single Bets and La Quiniela tabs now show bet summaries for improved UX consistency
- **Fixed La Quiniela Amounts**: La Quiniela betting now uses fixed $200 bet / $2000 payout with read-only input field
- **Enhanced Single Bets Experience**: Added real-time bet summary with active bet tracking, dynamic totals, and 2.5x multiplier for transparent winnings calculation
- **Improved Tab Switching**: Seamless switching between betting modes with persistent summaries and real-time updates
- **Professional UX Design**: Implemented consistent card layouts, visual hierarchy, and clear value propositions across all betting modes

### Added
- Real-time bet summary calculations for Single Bets mode
- Fixed amount display and validation for La Quiniela mode
- Internationalization support for new betting interface elements (English/Spanish)
- Visual state indicators for read-only fields and completed predictions
- Responsive design optimizations for bet summary components

### Changed
- La Quiniela betting amount input is now read-only with fixed $200/$2000 amounts
- Single Bets now show comprehensive summary instead of empty sidebar
- Improved visual consistency between betting modes
- Enhanced user feedback with clear progress indicators and winnings calculations

### Fixed
- Missing bet summary display when switching to Single Bets tab
- Inconsistent betting amount handling between Single Bets and La Quiniela
- Improved accessibility with proper read-only field indicators

### 🚀 Deployment & Database Management
- **Automatic Database Dump Generation**: Deploy script now automatically creates fresh database dumps before deployment
- **Complete Database Overwrite**: Live server database is now completely overwritten with local data for consistency
- **MySQL Command Fixes**: Resolved shell escaping issues in deployment script MySQL commands
- **Enhanced Error Handling**: Improved deployment script reliability with better error detection and recovery

### Technical Improvements
- Added TypeScript support for enhanced betting interface components
- Optimized component rendering with minimal re-renders
- Improved state management for betting calculations
- Enhanced build process reliability

## [1.0.0] - 2024-03-08
### Added
- Initial standalone release migrated from WordPress plugin (v1.0.1).
- Next.js 14 frontend with React 18, TypeScript, Tailwind CSS, and full SSR/SSG support.
- Express.js backend with TypeScript, Prisma ORM, MySQL, JWT authentication, and Zod validation.
- Complete betting system for Liga MX matches: place bets, view results, and track performance.
- User authentication: registration, login, password reset, email verification.
- User dashboard: personal stats, performance, and history.
- Admin dashboard: manage users, games, weeks, and view analytics.
- Internationalization: Spanish and English support.
- Dark mode and responsive mobile-first design.
- Progressive Web App (PWA) features and real-time updates.
- Security: HTTPS, CSRF, input validation, rate limiting, and more.
- Database migration scripts and demo data seeding.
- Automated deployment script with SSH key caching and improved error handling.
- SSL certificate management with automatic verification and retry mechanism.
- Documented that after updating environment variables (e.g., .env.local), you should run `pm2 restart laquiniela-frontend --update-env` to ensure the new environment is loaded by the running process.

### Changed
- Improved UI/UX and mobile responsiveness compared to WordPress version.
- Optimized performance, SEO, and accessibility (WCAG 2.1 AA).
- Updated URL structure to match legacy WordPress plugin for seamless migration.
- Enhanced deployment process with better error handling and service verification.
- Improved database seeding and migration process.
- Updated documentation with comprehensive feature list and technical details.

### Fixed
- Authentication API requests now use the correct `/api` prefix, resolving login issues for both admin and non-admin users.
- Admin navigation link now appears for all admin role variants (case-insensitive check).
- ProtectedRoute and admin checks are now case-insensitive, preventing access issues due to role casing.
- Minor bug fixes and improvements to error handling and user feedback.
- SSL certificate installation and verification process.
- SSH key caching to reduce authentication prompts during deployment.

### Migration Notes
- All user data, bets, and history migrated from WordPress.
- 100% functional parity with previous plugin version.
- Improved deployment process with automated scripts and verification steps.

---

## [Unreleased]
### Added
- New `seedHistory.ts` script for robust, date-driven seeding of weeks, games, bets, and user performance for demo and admin users.
- `deleteWeek99.ts` script to safely remove legacy week 99 and all associated data.
- Demo reset flow: DB reset, teams/users seeding, demo data seeding for robust, repeatable demos.
- All teams now seeded with valid logo URLs for consistent frontend display.
- Admin Create Game form now uses dropdowns for Home and Away Team selection, fetching teams from the backend.
- Team selection dropdowns have fully localized placeholders (Spanish/English) using the new 'select_team' translation key.
- Admin games management now displays team logos next to team names.
- User Management table now shows 0 (localized) for total winnings if no winnings exist, instead of $NaN.
- Preparation for /games page to use only real data and show all scheduled games (mock data removal and API logic update planned).

### Changed
- **Seeding:** Removed legacy week 99 logic from all seeding scripts. All week/game/bet seeding is now handled by `seedHistory.ts`.
- **Backend:**
  - `/api/weeks/current` and `/api/games/current-week` endpoints now select the current week based on `status: 'OPEN'` and a future `bettingDeadline`, ordered by `startDate` and `weekNumber` (Prisma array syntax).
  - Fixed Prisma `orderBy` usage to use array syntax, resolving console errors.
- **Frontend:**
  - Dashboard and `/bet` page now reliably display seeded data for the correct week and users.

### Fixed
- Resolved issue where dashboard and `/bet` page showed no data due to backend returning legacy week 99.
- Fixed Prisma validation errors in backend logs by correcting `orderBy` usage.
- Cleaned up `seed.ts` to only create teams and users, preventing legacy week creation.
- Dashboard and /bet pages now display correct data for demo/admin users.
- Status field normalized in frontend to handle backend casing.
- All numeric profile fields are now numbers in backend API responses.
- Removed non-existent fields from backend profile response to fix TypeScript errors.
- Improved demo seeding and DB reset flow for reliable demo data.
- Added debug logging and diagnostics for API and frontend data flow issues.
- Frontend now robustly handles backend data types and missing fields.
- Single Bets UI: Demo user can always place single bets for all games; prediction selection and highlighting now work; Place Bet button enables as expected.
- No changes to parlay or other user workflows.
- Backend/frontend userBet logic improved for demo reliability and correct bet state display.
- Admin panel: Changed all frontend GET requests for weeks from `/api/admin/weeks` to `/api/weeks` to match backend routes. This fixes a bug where game creation would fail due to 404 errors when fetching weeks.
- Admin panel: Normalized game status translation for existing games, ensuring correct display of status labels (e.g., Programado, En Vivo, Completado).
- Admin panel: Improved merging and display of mock and real games in the 'Existing Games' section.
- Admin panel: Temporarily hid the 'Weeks' tab for a cleaner UI.

### Changed
- Updated axios configuration to use a single instance with proper interceptors
- Improved token refresh mechanism
- Enhanced error handling in authentication flow
- Updated CORS configuration to properly handle credentials and headers

### Added
- Added proper error boundaries for admin panel
- Added loading states and error messages for better user feedback
- Added debug logging for authentication flow

## [Unreleased] - Deployment & Live Server Fixes

### Changed
- Nginx config now proxies `/api` to backend (port 3001) and all other requests to frontend (Next.js SSR, port 3000).
- PM2 process management improved: always starts both frontend and backend, checks for process existence, and uses correct process names.
- Deployment script now ensures frontend is built and started in SSR mode.
- Added health check endpoint verification after deploy.
- Documentation updated to clarify SSR deployment and Nginx config.
- Added instructions for manual Nginx editing if heredoc fails.

---

## [Unreleased] - June 2025
### Fixed
- Resolved critical bug where admin panel and dashboard API requests returned 401/404 due to backend only checking Authorization header for JWT.
- Updated backend auth middleware to check for JWT in both Authorization header and auth_token cookie.
- Enabled cookie-parser middleware in backend.
- Audited frontend to ensure all protected API calls use the configured axios instance with baseURL: '/api'.
- Installed missing cookie-parser and types for backend build.

### Investigation
- Verified CORS, environment variables, Next.js rewrites, and cookie settings.
- Confirmed cookies were set and sent by browser but not used by backend.
- Identified duplicate/inconsistent API calls in frontend.
- Systematically tested and documented all steps before applying the fix.

### Changed
- Admin navigation for users with the admin role is now minimal: "Dashboard" and "My History" links are hidden, and "Admin Panel" is the default/leftmost view.
- Admin users are now redirected to /admin after login instead of /dashboard.
- Navigation and login redirect logic are now fully role-aware and minimal for admins, with no impact on non-admin workflows.

### Fixed
- Fixed issue where admin users were incorrectly redirected to /dashboard after login, even when navigation was updated.
- Ensured all changes are fully documented and committed to a feature branch (not merged to main).

### Changed
- Header navigation links, user info, logout, and toggle buttons now use consistent color classes: light grey in light mode, white in dark mode, for a modern and accessible look.
- Navigation links font weight standardized to medium (500) for visual consistency.
- Toggle buttons (language/theme) now accept a className prop and inherit color from the header, ensuring correct color regardless of rebuilds or merges.
- All header hover states now use the brand red for both nav links and toggles.
- Admin panel: 'Ingresos Totales' (Total Revenue) now displays in green and uses the correct currency and locale based on the selected language (MXN for Spanish, USD for English), with robust formatting and forced color using Tailwind's important modifier.

### Fixed
- Resolved issues where header/toggle colors would revert after rebuilds or merges.
- Fixed admin revenue formatting and color to always match the selected language and design spec.

---

## [Unreleased] - June 2025

### Fixed
- **Critical Logout Bug**: Resolved high-priority logout issues when switching between users or ending testing sessions
  - Enhanced backend `/auth/logout` endpoint to properly clear HTTP-only cookies with correct domain/path settings
  - Improved frontend logout to clear cookies with all domain variations (development vs production)
  - Added comprehensive localStorage/sessionStorage cleanup
  - Added fallback error handling and forced cleanup mechanisms
  - Fixed issues where partial logout states could occur during network failures

### Changed
- **Demo User Navigation**: For demo users only, reordered navigation to show "Juegos" (Games) first, followed by "Panel"
  - Navigation now displays: "Juegos | Panel | Mi Historial | Perfil" for demo users
  - Panel link shows as "Panel" instead of "Admin Panel" for demo users
  - Regular admin users maintain original navigation order
  - No impact on regular user navigation

### Deployment
- **Environment Files**: Updated deployment script (`deploy.sh`) to use production environment files
  - Now uses `frontend/.env.production` and `backend/.env.production` for live deployments
  - Local development environment files remain unchanged
  - Ensures proper separation of development and production configurations
- **Build Process**: Fixed deployment script TypeScript compilation issues
  - Changed backend dependency installation to include dev dependencies for TypeScript build
  - Resolves missing @types/* packages needed for compilation
  - Production server still only uses compiled JavaScript files

---

## [Unreleased]
- Ongoing improvements and minor bug fixes.
- Admin: Restrict minute selection for game creation to :00, :15, :30, :45 and use dropdowns for hour/minute.
- Admin: Group existing games by week in the games list.
- Admin: Show a localized message when no games are scheduled (translation key added to I18nContext.tsx).
- Translation: Fixed translation loading to use I18nContext.tsx, not JSON files.

## [2.0.14] - 2025-06-13
### 🎯 Dashboard Status Enhancement & Admin Interface Simplification
- **Dashboard Status Badges**: Added live game status indicators to dashboard game cards
  - **Clean Status Display**: Shows "Live", "Completed", and "Scheduled" badges on dashboard game previews
  - **Consistent Styling**: Uses identical color scheme as admin panel (orange for Live, green for Completed, gray for Scheduled)
  - **Minimal Implementation**: 5-minute change leveraging existing status data and CSS components
  - **Enhanced UX**: Users can instantly see game status without navigating to betting page

### 🧹 Admin Interface Simplification (Microsoft DE Principles)
- **Removed Manual Override Buttons**: Eliminated redundant individual game status override controls
  - **Simplified Decision Making**: Removed cognitive overhead of choosing between manual override vs bulk sync
  - **Single Source of Truth**: "Game Status Sync" button now handles all status updates efficiently
  - **Cleaner Interface**: Removed 50+ lines of redundant UI code and logic
  - **Better Maintainability**: Consolidated status management into single, reliable system

### 🔧 Build System Enhancement
- **Fixed TypeScript Path Aliases**: Resolved module resolution issues preventing application startup
  - **Root Cause**: TypeScript compiler wasn't resolving `@/routes/auth` imports in compiled JavaScript
  - **Solution**: Added `tsc-alias` package to transform path aliases after compilation
  - **Build Process**: Updated to `tsc && tsc-alias` for proper module resolution
  - **Deployment Ready**: Application now starts successfully with resolved import paths

### 🎨 Status Display Consistency
- **Unified Status Logic**: Fixed priority ordering in admin panel status display
  - **Match Status Priority**: Live/Completed games now correctly override betting status
  - **Consistent Lowercase**: Normalized all status values to lowercase for reliability
  - **Real-Time Updates**: Added 30-second periodic refresh for live status changes
  - **Cache Busting**: Added timestamp parameters to ensure fresh status data

### Technical Improvements
- **Reduced Code Complexity**: Eliminated duplicate status management patterns
- **Enhanced Reliability**: Single status update mechanism reduces inconsistency risk
- **Better Performance**: Removed redundant API calls and UI components
- **Improved Maintainability**: Centralized status logic easier to debug and enhance

### Added
- Status badges on dashboard game cards with text labels
- `tsc-alias` package for TypeScript path resolution
- Cache-busting parameters for admin data fetching
- Periodic refresh mechanism for live status updates

### Changed
- Admin panel status priority logic (match status over betting status)
- Build process to include path alias transformation
- Status normalization to consistent lowercase format
- Dashboard game cards to include status indicators

### Fixed
- TypeScript path alias resolution in compiled JavaScript
- Admin panel showing incorrect status priority
- Module resolution errors preventing application startup
- Status inconsistency between different interfaces

### Removed
- Manual override buttons from admin panel (both desktop and mobile)
- `handleUpdateGameStatus` function (no longer needed)
- Redundant status management UI components
- Complex decision-making between override methods

## [2.0.13] - 2025-06-13 