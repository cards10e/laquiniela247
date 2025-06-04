# Issue: Dashboard 'Recent Activity' Only Shows Week 5, 0/1 Correct, $0.00

**Status: Closed — Display is now working as expected; no further action needed.**

## Observed Symptoms
- The dashboard's 'Recent Activity' section displays multiple entries for 'Week 5', all with 0/1 correct and $0.00 winnings.
- The date for each entry is the same (e.g., 6/4/2025).
- The betting history page (`/history`) displays correct historical data for the demo user.

## Likely Causes
- The backend `/api/users/stats` endpoint may be returning only recent bets for the most recent week, or not joining/mapping correctly to historic weeks.
- The seeding script may not be associating historic bets with the correct weeks, or may be overwriting data.
- The frontend is displaying what it receives, but the backend may be filtering or grouping incorrectly.

## Next Diagnostic Steps
1. Inspect the `/api/users/stats` response for the demo user and check the contents of `recentActivity.recentBets`.
2. Compare the data returned here with the data shown on the `/history` page.
3. Review the backend query and mapping logic for recent activity in `users.ts`.
4. Check the seeding script to ensure historic bets are associated with the correct weeks and users.
5. If needed, add debug logging to the backend endpoint to trace the data flow. 