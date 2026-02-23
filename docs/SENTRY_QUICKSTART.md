# Sentry Integration - Quick Start Guide

This guide will help you set up Sentry error tracking in the Inventaire SI application in less than 10 minutes.

## 📋 Prerequisites

- A Sentry account (free tier available at https://sentry.io/)
- Access to both backend and frontend `.env` files

## 🚀 Step 1: Create Sentry Projects

1. Go to https://sentry.io/ and sign in (or create an account)
2. Create **two new projects**:
   - **Backend Project**: Select "Node.js" as the platform
   - **Frontend Project**: Select "React" as the platform
3. For each project, copy the **DSN** (Data Source Name) URL
   - Example DSN: `https://abc123def456@o123456.ingest.sentry.io/7891011`

## ⚙️ Step 2: Configure Backend

### 2.1 Create/Update `.env` File

In `apps/api/`, create or update your `.env` file:

```bash
# Sentry Error Tracking (Backend)
SENTRY_DSN=https://YOUR_BACKEND_DSN_HERE
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.2
```

**Environment-specific recommendations:**

| Environment | `SENTRY_ENVIRONMENT` | `SENTRY_TRACES_SAMPLE_RATE` |
|-------------|---------------------|---------------------------|
| Development | `development`       | `1.0` (100%)              |
| Staging     | `staging`           | `0.5` (50%)               |
| Production  | `production`        | `0.1` to `0.3` (10-30%)   |

### 2.2 Test Backend Integration

```bash
cd apps/api
npm run dev
```

Check the console output. You should see:
```
[Sentry] Initialized successfully (production)
```

If you see:
```
[Sentry] DSN not configured. Error tracking is disabled.
```
Double-check your `.env` file and ensure `SENTRY_DSN` is set correctly.

## 🌐 Step 3: Configure Frontend

### 3.1 Create/Update `.env` File

In `apps/web/`, create or update your `.env` file:

```bash
# Sentry Error Tracking (Frontend)
VITE_SENTRY_DSN=https://YOUR_FRONTEND_DSN_HERE
VITE_SENTRY_ENVIRONMENT=production

# Performance Monitoring
VITE_SENTRY_TRACES_SAMPLE_RATE=0.3

# Session Replay
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0

# Application Version
VITE_APP_VERSION=0.8.0
```

**Important Notes:**
- Use **different DSNs** for backend and frontend (different Sentry projects)
- All frontend variables must start with `VITE_` prefix
- Session replay captures user sessions for debugging (privacy-safe, text is masked)

### 3.2 Test Frontend Integration

```bash
cd apps/web
npm run dev
```

Open your browser to http://localhost:5173 and check the console. You should see:
```
[Sentry] Initialized successfully (production)
[CSRF] Token initialized successfully
```

## ✅ Step 4: Test Error Tracking

### 4.1 Test Backend Error Tracking

Create a test error by calling a non-existent API endpoint:

```bash
curl http://localhost:3001/api/test-error
```

Check your Sentry backend project dashboard. You should see the error appear within seconds.

### 4.2 Test Frontend Error Tracking

**Option A: Using Browser Console**

Open your application in the browser, open the console (F12), and run:

```javascript
throw new Error("Test error from console");
```

**Option B: Create a Test Button**

Add this to any component temporarily:

```jsx
<button onClick={() => {
  throw new Error("Test Sentry Error");
}}>
  Test Error
</button>
```

Click the button and check your Sentry frontend project dashboard.

### 4.3 Test User Context (After Login)

1. Log in to the application
2. Trigger any error (using methods above)
3. In Sentry, check the error details
4. You should see user information (email, username, ID) in the error context

## 📊 Step 5: Verify Setup

### Backend Checklist

- ✅ Sentry initialized message appears in console
- ✅ Test errors appear in Sentry dashboard
- ✅ Errors show request context (URL, method, headers)
- ✅ Stack traces are visible and readable
- ✅ Sensitive data (passwords, tokens) is filtered

### Frontend Checklist

- ✅ Sentry initialized message appears in browser console
- ✅ Test errors appear in Sentry dashboard
- ✅ Navigation breadcrumbs are captured
- ✅ User context appears after login
- ✅ Session replays are available (if enabled)

## 🎯 What's Already Configured

The Inventaire SI application has Sentry **pre-configured** with the following features:

### Backend Features ✅

- ✅ **Automatic error capturing** - All unhandled errors sent to Sentry
- ✅ **Performance monitoring** - API response times tracked
- ✅ **Profiling** - CPU/memory usage insights
- ✅ **Request context** - URL, method, user agent
- ✅ **User tracking** - Authenticated user info in errors
- ✅ **Data filtering** - Sensitive headers removed (Authorization, Cookie)
- ✅ **Environment separation** - Development vs Production
- ✅ **Release tracking** - Errors tagged with app version

### Frontend Features ✅

- ✅ **Automatic error capturing** - React errors caught by Error Boundary
- ✅ **Performance monitoring** - Page load times, route changes
- ✅ **Session replay** - Video-like playback of user sessions
- ✅ **Breadcrumbs** - User actions before error occurred
- ✅ **User context** - Automatically set after login
- ✅ **Navigation tracking** - React Router integration
- ✅ **Data filtering** - Sensitive data removed (tokens, passwords)

## 🔧 Advanced Configuration

### Adjusting Sample Rates

**Performance Traces** (`SENTRY_TRACES_SAMPLE_RATE`):
- Controls % of transactions sent to Sentry
- Higher = more data, faster quota usage
- Lower = less data, slower quota usage
- Recommended: 0.1-0.3 in production

**Session Replays** (Frontend only):
- `REPLAYS_SESSION_SAMPLE_RATE`: Normal sessions (0.1 = 10%)
- `REPLAYS_ON_ERROR_SAMPLE_RATE`: Error sessions (1.0 = 100%)
- Replays help debug user issues but use quota

### Environment-Specific Settings

**Development:**
```bash
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0  # Track everything
```

**Staging:**
```bash
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=0.5
```

**Production:**
```bash
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.2  # Balance cost vs visibility
```

### Disabling Sentry (Development)

To disable Sentry (e.g., for local development), simply remove or comment out the DSN:

**Backend (.env):**
```bash
# SENTRY_DSN=  # Commented out - Sentry disabled
```

**Frontend (.env):**
```bash
# VITE_SENTRY_DSN=  # Commented out - Sentry disabled
```

## 🐛 Troubleshooting

### Backend: "DSN not configured"

**Problem:** Console shows "DSN not configured. Error tracking is disabled."

**Solutions:**
1. Check that `.env` file exists in `apps/api/`
2. Verify `SENTRY_DSN` is set (no typos)
3. Restart the backend server after changing `.env`
4. Ensure DSN format: `https://...@....ingest.sentry.io/...`

### Frontend: No errors appearing in Sentry

**Problem:** Errors thrown but not showing in Sentry dashboard

**Solutions:**
1. Check browser console for Sentry initialization message
2. Verify `VITE_SENTRY_DSN` in `apps/web/.env`
3. Rebuild frontend: `npm run build` (Vite caches env vars)
4. Check Network tab for requests to `sentry.io` (should see them)
5. Verify DSN is for **frontend project** (not backend project)

### Errors not showing user context

**Problem:** User info missing from error reports

**Solution:** User context is only set **after login**. Errors before login won't have user info.

### Too many errors / quota exceeded

**Problem:** Sentry quota exceeded, errors not tracked

**Solutions:**
1. Reduce `TRACES_SAMPLE_RATE` (e.g., 0.1 instead of 1.0)
2. Add more error filtering (see `beforeSend` in config)
3. Upgrade Sentry plan for higher quota
4. Use `ignoreErrors` to filter noise (already configured)

## 📚 Next Steps

1. **Set up alerts:** Configure Sentry to email/Slack you for critical errors
2. **Create releases:** Tag errors with git commits for better debugging
3. **Review errors regularly:** Check Sentry dashboard weekly
4. **Fine-tune sampling:** Adjust rates based on quota usage
5. **Enable source maps:** Upload source maps for better stack traces (production)

## 🔗 Additional Resources

- **Sentry Documentation:** https://docs.sentry.io/
- **Node.js SDK:** https://docs.sentry.io/platforms/node/
- **React SDK:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Error Monitoring Best Practices:** https://docs.sentry.io/product/error-monitoring/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/

## 📞 Support

For detailed configuration and advanced features, see:
- `docs/SENTRY_INTEGRATION.md` - Complete integration guide
- Backend config: `apps/api/src/config/sentry.js`
- Frontend config: `apps/web/src/lib/sentry.ts`

---

**✨ That's it! Sentry is now tracking errors in both backend and frontend.**

Login to your application and navigate around. Any errors will automatically appear in your Sentry dashboards with full context, breadcrumbs, and user information.
