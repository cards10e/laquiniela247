# Issue: Single Bets UI - Captioning and Bet Placement Problems

**Status: Closed — Fixed.**

**Fix:**
- Demo user can always place single bets for all games in the current week.
- Prediction selection and highlighting now work as expected.
- Place Bet button enables when a prediction is selected and amount is valid.
- userBet logic improved in backend/frontend for demo reliability and correct bet state display.

## Observed Symptoms
- The Single Bets tab shows odd or untranslated captions (e.g., 'betting.your_prediction: betting.home').
- 'Bet placed successfully!' messages are shown for each game, even when the user should be able to place a new bet.
- The UI does not allow the user to place single bets for each game as expected (bet buttons are missing or disabled).

## Expected Behavior
- Captions and messages should be correctly translated and user-friendly (e.g., 'Your prediction: Home').
- The user should be able to place a single bet for each game, unless a bet has already been placed for that game.
- Only show 'Bet placed successfully!' for games where the user has already placed a bet; otherwise, show prediction buttons.

## Next Diagnostic Steps
1. Review the frontend logic for rendering single bets, especially the conditions for showing bet messages vs. prediction buttons.
2. Check the translation keys and ensure correct usage in the UI.
3. Confirm the backend is returning the correct bet status for each game.
4. Test placing and removing bets to verify UI updates as expected.
5. Add debug logging if needed to trace bet state and UI rendering. 