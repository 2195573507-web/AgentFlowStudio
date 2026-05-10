# Agent E - Route-level ErrorBoundary

Avoid whole-app white screens when a route render fails.

Focus files:

- `static-app\app.js`
- `src\renderer\App.tsx`
- `src\renderer\components`
- `src\renderer\routes`

Must confirm or implement:

- Static fallback wraps page render in try/catch.
- Static fallback error UI is localized and includes View logs and Back to Dashboard actions.
- React has `src\renderer\components\ErrorBoundary.tsx`.
- Each major route is wrapped at route level.
- Console errors are preserved.
