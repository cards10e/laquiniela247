# Test Users Guide

This guide shows you the simple ways to add test users to La Quiniela 247 for testing purposes.

## 🚀 Quick Methods

### Method 1: Create Multiple Test Users (Easiest)
```bash
cd backend
npm run create:test-users
```

This creates 3 test users instantly:
- **Jim**: `jim@laquiniela247.mx` / `test123`
- **Juan Carlos**: `juancarlos@laquiniela247.mx` / `test123`
- **Dimitri**: `dimitri@laquiniela247.mx` / `test123`

### Method 2: Create Individual Test User
```bash
cd backend
npm run create:test-user -- user@example.com password123 John Doe USER
```

**Parameters:**
- `email` (required)
- `password` (required)
- `firstName` (optional, defaults to "Test")
- `lastName` (optional, defaults to "User")
- `role` (optional, USER or ADMIN, defaults to USER)

**Examples:**
```bash
# Basic user
npm run create:test-user -- john@test.com pass123

# Full details
npm run create:test-user -- admin@test.com admin123 John Admin ADMIN

# Spanish name
npm run create:test-user -- maria@test.com test123 María González USER
```

### Method 3: Use Registration Page
1. Go to `/register` in your browser
2. Fill out the form with test user details
3. Submit to create the user

**Note**: There's currently a backend validation issue with `termsAccepted` and `newsletter` fields that needs fixing.

## 🔧 Advanced Options

### Reset Existing User Password
```bash
cd backend
npx tsx scripts/resetAdminPassword.ts user@example.com newpassword123
```

### Clean Up Test Users
```bash
cd backend
npm run cleanup:test-users
```
This safely removes all test users while preserving demo and admin users.

### View All Users in Database
```bash
cd backend
npx prisma studio
```
Then navigate to the `User` table to see all users.

## 📋 Default Test Users

Your app comes with these pre-seeded users:

### Demo User
- **Email**: `demo@laquiniela247.mx`
- **Password**: 
- **Role**: USER
- **Purpose**: Has sample betting data for demonstrations

### Admin User
- **Email**: `admin@laquiniela247.mx`
- **Password**: 
- **Role**: ADMIN
- **Purpose**: Full admin access to manage games, users, etc.

## 🎯 User Features

All created test users include:
- ✅ Email verified (ready to use immediately)
- ✅ User profile with default settings
- ✅ Spanish language preference
- ✅ Email notifications enabled
- ✅ Ready for betting on available games

## 🛠️ Troubleshooting

### "User already exists" Error
The scripts check for existing users and skip them safely. No data is overwritten.

### Database Connection Issues
Make sure your database is running and `DATABASE_URL` is set correctly in `.env`.

### Permission Errors
Ensure you're running the commands from the `backend` directory with proper database access.

## 🔍 Verification

After creating users, verify they work by:
1. Going to `/login`
2. Using the test credentials
3. Checking they can access `/dashboard` or `/bet`

---

**Pro Tip**: Use Method 1 to quickly create multiple users for testing user interactions, rankings, and multi-user scenarios! 