# Admin Game Management User Guide

**Complete Guide to Managing Games in La Quiniela 247 Admin Panel**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Auto-Management Controls](#auto-management-controls)
3. [Create Game Form](#create-game-form)
4. [Status Legend](#status-legend)
5. [Games List Management](#games-list-management)
6. [Week Management](#week-management)
7. [Mobile vs Desktop Interface](#mobile-vs-desktop-interface)
8. [Troubleshooting Common Scenarios](#troubleshooting-common-scenarios)
9. [Best Practices](#best-practices)

---

## Overview

The Games Management tab is your central hub for creating, organizing, and managing all football matches in the system. This interface handles everything from game creation to automatic status updates and betting window management.

### Key Sections:
- **Auto-Management Controls**: Smart automation for betting windows and game statuses
- **Create Game Form**: Add new games to the system
- **Status Summary**: Quick overview of current system state (mobile only)
- **Games List**: View and manage all existing games by week
- **Status Legend**: Color-coded explanation of all status types

---

## Auto-Management Controls

### 🎯 Betting Window Control

**What it does:** Manages when betting becomes available for scheduled games.

#### Status Indicators:
- **🟢 "X weeks open"** - Weeks currently accepting bets
- **📊 "X need attention"** - Weeks with games ready to open for betting
- **💤 "All current"** - No action needed

#### Action Button States:
- **🎯 "Open X Betting Windows"** (Orange) - Click to open betting for ready weeks
- **✅ "All Current"** (Disabled) - No weeks need opening

#### When to Use:
- **Daily**: Check if any weeks need betting windows opened
- **Before game weekends**: Ensure all upcoming games have betting available
- **When you see orange warning status**: Action required

#### How It Works:
1. System identifies games scheduled within 7 days
2. Shows weeks that have games ready for betting
3. One click opens betting for all ready weeks simultaneously
4. Automatically sets betting deadline 2 hours before first game

### ⚡ Game Status Sync

**What it does:** Keeps game statuses current based on actual match times using real-time calculations.

#### Status Indicators:
- **🔄 "X games need status updates"** - Games with outdated statuses
- **✅ "All statuses updated"** - All games reflect current reality

#### Action Button States:
- **🔄 "Sync Game Statuses"** (Orange) - Click to update outdated statuses
- **✅ "All Current"** (Disabled) - All statuses are accurate

#### Automatic Status Logic:
- **Scheduled → Live**: Happens **exactly at game start time**
- **Live → Completed**: Happens **2.5 hours (150 minutes) after game start**
- **Manual Override**: Available for exceptions (delays, early endings)

#### Technical Details:

**Real-Time Calculation Engine:**
The system uses precise time-based calculations comparing current time vs. scheduled game time:

```
Current Time vs Game Time Analysis:
├── Game hasn't started yet → SCHEDULED
├── Game started 0-150 minutes ago → LIVE  
└── Game started 150+ minutes ago → COMPLETED
```

**Automatic Update Triggers:**
- ✅ **Every admin panel page load** - Games auto-update before display
- ✅ **Every API call** to fetch games - Real-time status checking
- ✅ **Manual sync button** - Batch updates all outdated games
- ✅ **Background processing** - Continuous monitoring

**Example Timeline:**
```
Game scheduled for 3:00 PM:

2:59 PM → Status: SCHEDULED
3:00 PM → Status: LIVE (automatic transition)
5:30 PM → Status: COMPLETED (2.5 hours later)
```

**Batch Update Process:**
1. System scans all SCHEDULED and LIVE games
2. Calculates correct status for each based on time
3. Updates database in batch for efficiency
4. Returns count of games updated

#### When to Use:
- **Hourly during game days**: Ensure statuses reflect reality
- **Before/after major events**: Verify all games show correct status
- **When you see orange warning**: Immediate sync recommended
- **After system maintenance**: Verify all games current

#### Benefits:
- ✅ **95% automation** - Eliminates manual status management
- ✅ **Real-time accuracy** - Status always reflects game state
- ✅ **Efficient processing** - Batch updates for performance
- ✅ **Admin override** - Manual control for exceptional cases

---

## Create Game Form

### Required Fields:

#### 1. Week Selection
- **Purpose**: Assigns game to a specific week/jornada
- **Options**: Shows available weeks with date ranges
- **Format**: "Week X (MMM d - MMM d)"
- **Validation**: Must select a week before other fields activate

#### 2. Game Date & Time
- **Date Field**: Calendar picker with restrictions
  - **Minimum**: Within selected week's start date
  - **Maximum**: Within selected week's end date
- **Hour Dropdown**: 24-hour format (00-23)
- **Minute Dropdown**: 15-minute intervals (00, 15, 30, 45)
- **Result**: Combined into single datetime for storage

#### 3. Team Selection
- **Home Team**: Dropdown of all available teams
- **Away Team**: Dropdown excluding selected home team
- **Validation**: Same team cannot be both home and away
- **Display**: Shows team logos in games list after creation

### Form Behavior:
- **Week selection**: Resets game date when changed
- **Team selection**: Automatically filters opposing dropdown
- **Submit**: Creates game and refreshes games list
- **Validation**: All fields required before submission

### Success/Error Handling:
- **Success**: "Game created successfully" notification
- **Error**: "Failed to create game" with details
- **Automatic**: Form resets after successful creation

---

## Status Legend

**Purpose**: Explains all colored badges used throughout the interface.

### 🟢 Week Status (Green)
- **Controls**: Whether users can bet on games in this week
- **States**: Open, Closed, Upcoming, Completed
- **Admin Impact**: Determines overall betting availability

### 🔴 Betting Status (Pink/Red)
- **Controls**: Individual game betting windows
- **States**: Open for betting, Ready, Scheduled, Past
- **Admin Impact**: Fine-grained betting control per game

### 🔵 Auto-Scheduled (Light Blue)
- **Controls**: Automatic timing for betting window opening
- **Display**: Shows auto-open date (e.g., "Auto: 6/13")
- **Admin Impact**: Games will open automatically on specified date

### ⚪ Match Status (Grey)
- **Controls**: Current state of the actual game/match
- **States**: Scheduled, Live, Completed
- **Admin Impact**: Reflects real-world game progress

### Responsive Design:
- **Mobile**: Single column, compact layout
- **Tablet**: 2 columns
- **Desktop**: 4 columns for full visibility

---

## Games List Management

### Week Organization

Games are grouped by week with expandable sections:

#### Week Header Elements:
- **Week Number**: "Week X" title
- **Week Status Badge**: Shows current week state
- **Action Buttons**: Context-sensitive based on week status

#### Week Actions:
- **"Open Betting for This Week"** - Opens betting window selection
- **"Open now (X)"** - Quick open for ready games
- **Status indicators** - Shows current week state

### Individual Game Cards

#### Mobile Interface (< 1024px):

**Always Visible:**
- **Team matchup**: Home vs Away with logos
- **Game date/time**: Formatted for readability
- **Primary status badge**: Most important status only
- **Expand indicator**: ▶ (collapsed) / ▼ (expanded)

**Tap to Expand:**
- **Detailed statuses**: Betting and match status breakdown
- **Action buttons**: 44px touch-friendly buttons
- **Full functionality**: All desktop features accessible

#### Desktop Interface (≥ 1024px):

**Always Visible:**
- **Complete information**: Teams, date, all statuses
- **Inline actions**: Direct access to all buttons
- **Hover effects**: Visual feedback for interactions

### Action Buttons

#### ⚡ Manual Override
- **Purpose**: Correct status when automatic timing is wrong
- **Available when**: Game is Scheduled or Live
- **Behavior**: 
  - Scheduled → Live (for games that started early/late)
  - Live → Completed (for games that ended early)
- **Use cases**: Delays, technical issues, early endings

#### 🗑️ Delete Game
- **Purpose**: Remove games from system
- **Confirmation**: Asks "Are you sure?" before deletion
- **Impact**: Permanently removes game and associated data
- **Use cases**: Duplicate entries, cancelled games

### Status Badge Details

#### Primary Status Priority (Mobile):
1. **🔴 Live** - Game happening now (highest priority)
2. **✅ Completed** - Game finished
3. **🎯 Betting Available** - Currently accepting bets
4. **🟡 Ready** - Needs admin attention
5. **⚪ Scheduled** - Future game (lowest priority)

#### Detailed Status View (Expanded):
- **🎯 Betting Status**: Current betting window state
- **⏰ Match Status**: Real-world game progress
- **Additional info**: Auto-open dates, descriptions

---

## Week Management

### Week Status Flow:

1. **Upcoming** → Week created, games scheduled
2. **Ready** → Games within 7 days, ready for betting
3. **Open** → Betting active, deadline set
4. **Closed** → Betting deadline passed
5. **Completed** → All games finished

### Betting Deadline Options:

When opening betting for a week, choose deadline timing:

- **12 Hours before game** - Early closure for preparation
- **6 Hours before game** - Standard timing
- **2 Hours before game** - Late closure for maximum betting

**Automatic calculation**: System finds earliest game in week and calculates deadline accordingly.

### Week Actions:

#### "Open Betting for This Week"
1. Click button next to week header
2. Select deadline timing (12h, 6h, or 2h before first game)
3. System calculates exact deadline timestamp
4. Week status changes to "Open"
5. Users can start placing bets

#### "Open now (X)" Quick Action
- Appears for weeks with games ready for betting
- Uses default 2-hour deadline
- One-click opening for efficiency

---

## Mobile vs Desktop Interface

### Mobile Features (< 1024px):

#### Status Summary Card:
- **Purpose**: Quick overview at top of page
- **Content**: Counts of weeks/games needing attention
- **Visibility**: Only shown on mobile devices
- **Update**: Real-time based on current data

#### Progressive Disclosure:
- **Collapsed view**: Essential info only
- **Tap to expand**: Reveals detailed status and actions
- **Touch-friendly**: 44px minimum button sizes
- **Optimized layout**: Single column for readability

#### Simplified Navigation:
- **Fewer badges**: Single primary status per game
- **Larger touch targets**: Easy finger navigation
- **Vertical stacking**: Better for narrow screens

### Desktop Features (≥ 1024px):

#### Full Information Display:
- **All statuses visible**: No expanding required
- **Inline actions**: Direct button access
- **Multi-column layout**: Efficient space usage
- **Hover states**: Enhanced interaction feedback

#### Larger Status Legend:
- **4-column grid**: All status types visible
- **Detailed descriptions**: Full explanatory text
- **Color coding**: Complete visual reference

---

## Troubleshooting Common Scenarios

### 🚨 Problem: "Games stuck in wrong status"

**Symptoms**: Games show "Scheduled" but are actually live/finished

**Solution**:
1. Go to "Game Status Sync" card
2. Look for orange "🔄 Sync Game Statuses" button
3. Click to automatically update all outdated statuses
4. Check individual games for manual override if needed

**Prevention**: Run sync hourly during game days

### 🚨 Problem: "Users can't bet on upcoming games"

**Symptoms**: Week shows ready games but betting not available

**Solution**:
1. Check "Betting Window Control" card
2. Look for orange "🎯 Open X Betting Windows" button  
3. Click to open betting for ready weeks
4. Verify week status changed to "Open"

**Prevention**: Check daily for weeks needing attention

### 🚨 Problem: "Game times are wrong"

**Symptoms**: Game shows incorrect date/time

**Solution**:
1. Cannot edit existing games (by design)
2. Delete incorrect game using 🗑️ button
3. Create new game with correct information
4. Verify all details before submission

**Prevention**: Double-check all fields before creating games

### 🚨 Problem: "Duplicate games appearing"

**Symptoms**: Same matchup appears multiple times

**Solution**:
1. Identify the correct game (check date/time)
2. Delete duplicates using 🗑️ button
3. Confirm each deletion when prompted

**Prevention**: Check existing games before creating new ones

### 🚨 Problem: "Auto-scheduled games not opening"

**Symptoms**: Blue "Auto: X/XX" badges but no betting available

**Solution**:
1. Check if auto-open date has passed
2. Use "Betting Window Control" to manually open
3. Verify week status changed appropriately

**Prevention**: Monitor auto-scheduling during setup

### 🚨 Problem: "Mobile interface too crowded"

**Symptoms**: Difficulty navigating on small screens

**Solution**:
1. Use Status Summary for quick overview
2. Tap game cards to expand only when needed
3. Focus on one week at a time
4. Use week-level actions for bulk operations

**Prevention**: Familiarize yourself with progressive disclosure

---

## Best Practices

### Daily Routine:

#### Morning Check (9 AM):
1. **Review Status Summary** - Identify any attention needed
2. **Check Betting Window Control** - Open any ready weeks
3. **Verify upcoming games** - Ensure correct scheduling

#### Game Day Monitoring:
1. **Hourly Status Sync** - Keep game statuses current
2. **Monitor live games** - Override if issues occur
3. **Verify completed games** - Ensure proper closure

#### Evening Review:
1. **Check all statuses** - Ensure day's games properly updated
2. **Plan next day** - Identify upcoming needs
3. **Verify betting windows** - Confirm proper timing

### Weekly Planning:

#### Monday - Setup:
- Create next week's games
- Set team matchups and times
- Verify all information accuracy

#### Wednesday - Preparation:
- Open betting for upcoming week
- Set appropriate deadlines
- Communicate to users if needed

#### Friday - Final Check:
- Verify all weekend games ready
- Confirm betting deadlines
- Prepare for game day monitoring

#### Sunday - Cleanup:
- Ensure all games marked completed
- Review any manual overrides needed
- Plan next week's schedule

### Efficiency Tips:

#### Use Automation:
- Rely on auto-status updates for routine changes
- Use bulk betting window opening
- Trust auto-scheduling when possible

#### Mobile Optimization:
- Use Status Summary for quick checks
- Master tap-to-expand for detailed work
- Keep mobile sessions focused and brief

#### Desktop Power Features:
- Use full status legend for reference
- Leverage inline actions for efficiency
- Monitor multiple weeks simultaneously

#### Error Prevention:
- Double-check all game details before creation
- Use consistent timing patterns
- Monitor auto-scheduling effectiveness

---

## Quick Reference

### Status Colors:
- 🟢 **Green** = Week Status (betting control)
- 🔴 **Red/Pink** = Betting Status (game-level betting)
- 🔵 **Blue** = Auto-Scheduled (automatic timing)
- ⚪ **Grey** = Match Status (real-world game state)

### Action Priority:
1. **Orange buttons** = Immediate attention needed
2. **Green status** = System functioning normally
3. **Disabled buttons** = No action required

### Emergency Actions:
- **Manual Override** = Fix incorrect auto-status
- **Delete Game** = Remove problematic entries
- **Manual Betting Open** = Override auto-scheduling

### Mobile Shortcuts:
- **Tap game card** = Expand/collapse details
- **Status Summary** = Quick system overview
- **Progressive disclosure** = Focus on what matters

---

*This guide covers every aspect of the Games Management interface. For additional support or feature requests, refer to the technical documentation or contact the development team.* 