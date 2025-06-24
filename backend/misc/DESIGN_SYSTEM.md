# La Quiniela 247 - Design System

## Heading Hierarchy & Consistency

This document outlines the consistent heading design system implemented across all pages and components in La Quiniela 247.

### Heading Classes

#### 1. Page Titles (H1)
**Class:** `.page-title`
**Usage:** Main page headers
**Style:** `text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2`
**Examples:**
- Dashboard: "Welcome, Demo!"
- Admin Panel: "Admin Panel"
- Profile: "Profile"
- History: "My History"

#### 2. Section Titles (H2)
**Class:** `.section-title`
**Usage:** Major sections with left border accent
**Style:** `text-primary-600 dark:text-primary-400 text-xl font-semibold my-8 border-l-4 border-primary-600 dark:border-primary-400 pl-4`
**Examples:**
- "Performance Overview"
- "Current Week"
- "Quick Actions"
- "Recent Activity"

#### 3. Subsection Titles (H3)
**Class:** `.subsection-title`
**Usage:** Section subdivisions
**Style:** `text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4`
**Examples:**
- "Week 24" (in betting interface)
- "Select Predictions"
- "Betting Closed"
- "No Bets Found"

#### 4. Card Titles (H2/H3)
**Class:** `.card-title`
**Usage:** Headers within cards
**Style:** `text-lg font-semibold text-secondary-900 dark:text-secondary-100`
**Examples:**
- "Personal Info"
- "User Management"
- "Create Game"
- "Performance Stats"

#### 5. Content Titles (H4/H5)
**Class:** `.content-title`
**Usage:** Smaller content headers
**Style:** `text-base font-medium text-secondary-900 dark:text-secondary-100 mb-2`
**Examples:**
- "New Bet"
- "View History"
- "Email Notifications"
- "SMS Notifications"

#### 6. Performance Card Titles
**Class:** `.performance-card-title`
**Usage:** Titles within performance metric cards
**Style:** `text-base text-primary-600 dark:text-primary-400 mb-2`
**Examples:**
- "Total Bets"
- "% Correct"
- "Total Winnings"
- "Ranking Percentile"

### Implementation Guidelines

#### Consistency Rules
1. **Always use the predefined classes** instead of inline styles
2. **Match heading level with semantic importance** (H1 for page titles, H2 for sections, etc.)
3. **Maintain visual hierarchy** - larger/more prominent headings for more important content
4. **Use consistent spacing** - classes include appropriate margins
5. **Support dark mode** - all classes include dark mode variants

#### Color Scheme
- **Primary accent:** `text-primary-600 dark:text-primary-400` (red brand color)
- **Standard text:** `text-secondary-900 dark:text-secondary-100` (high contrast)
- **Secondary text:** `text-secondary-600 dark:text-secondary-400` (medium contrast)

#### Special Cases
- **Login/Register pages:** Use `page-title` with additional `text-center text-primary-600 dark:text-primary-400` for brand emphasis
- **Week banners:** Use `subsection-title` with `text-white` override for white text on colored backgrounds
- **Error states:** Use `subsection-title` for error headings

### Pages Updated
✅ Dashboard (`/dashboard`)
✅ Admin Panel (`/admin`)
✅ Betting Interface (`/bet`)
✅ History (`/history`)
✅ Profile (`/profile`)
✅ Login (`/login`)
✅ Register (`/register`)
✅ Error Boundary Component

### Benefits
- **Visual Consistency:** All similar heading types look identical across pages
- **Maintainability:** Changes to heading styles only need to be made in CSS
- **Accessibility:** Proper semantic heading hierarchy
- **Dark Mode Support:** Consistent appearance in both light and dark themes
- **Developer Experience:** Clear class names make it easy to apply correct styles

### Future Additions
When adding new pages or components:
1. Use the appropriate heading class from this system
2. Avoid creating new heading styles unless absolutely necessary
3. If new heading types are needed, add them to `globals.css` and document here
4. Test in both light and dark modes 