# Issue: Demo User Login Works Once, Fails After Logout (Unless Rebuild)

## Observed Symptoms
- Logging in as the demo user works the first time after a fresh build.
- After logging out, attempting to log back in as the demo user fails (no error details provided yet).
- Logging in works again only after rebuilding the project.

## Likely Causes
- JWT token or session cookie is not being cleared properly on logout.
- Backend may be caching or not properly invalidating sessions or tokens.
- Frontend may not be clearing cookies or local storage on logout.
- There may be a bug in the login or logout handler (frontend or backend).

## Next Diagnostic Steps
1. Check browser cookies and local storage after logout—are any tokens still present?
2. Check backend logs for errors or warnings on login after logout.
3. Try logging in with a different user after logging out—does it work?
4. Review the logout logic in the frontend and backend to ensure all tokens/cookies are cleared.
5. Add debug logging to the login and logout endpoints to trace the flow. 