# 🛠️ ImpulseQ – Task List

## 🔥 Priority: CRITICAL (Fix Immediately)

### 1. Environment Variables
- [x] Add to Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [x] Validate usage in code
- [x] Add runtime checks for missing values

---

### 2. Supabase Setup
- [x] Fix `supabase.ts`
- [x] Ensure correct initialization
- [x] Prevent undefined errors
- [x] Add debug logs

---

### 3. Fix App Crash
- [x] Identify blank screen cause
- [x] Check console errors
- [x] Fix failing API calls
- [x] Ensure app renders fallback UI

---

### 4. Remove Unsafe Redirects
- [x] Search:
  - `window.location`
  - `location.href`
- [x] Replace with `useNavigate()`
- [x] Add safety check for `chrome-error`

---

### 5. Fix Booking Logic
- [x] Remove duplicate `canOverride`
- [x] Prevent variable shadowing
- [x] Ensure override logic works correctly
- [x] Validate appointment creation flow

---

## ⚙️ Priority: HIGH (Stability)

### 6. Error Handling
- [x] Add React Error Boundary
- [x] Prevent full app crash
- [x] Show fallback UI

---

### 7. API Resilience
- [x] Wrap all API calls in `try/catch`
- [x] Handle Supabase failures gracefully
- [x] Add user-friendly error messages

---

### 8. Loading States
- [x] Add loaders for all pages
- [x] Prevent blank UI
- [x] Improve UX during fetch

---

## 🚀 Priority: MEDIUM (Deployment)

### 9. Vercel Fixes
- [x] Verify env variables
- [x] Check build logs
- [x] Fix deployment errors
- [x] Confirm correct routing

---

### 10. Debugging Setup
- [x] Add console logs:
  - App init
  - Supabase calls
  - Errors
- [x] Use DevTools:
  - Network tab
  - Console

---

## 🧪 Testing

### Manual Tests
- [x] App loads successfully
- [x] Booking works
- [x] Queue updates
- [x] Dashboard renders correctly

---

### Edge Cases
- [ ] No internet
- [ ] Missing env variables
- [ ] Invalid user session
- [ ] Empty database

---

## 📈 Future Tasks

### Architecture
- [ ] Add global state (Zustand)
- [ ] Create service layer
- [ ] Clean folder structure

---

### Features
- [ ] IoT device integration
- [ ] Smart token system
- [ ] Notification system

---

### Performance
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Optimize queries

---

## ✅ Definition of Done

- [ ] No crashes
- [ ] No unsafe redirect errors
- [ ] Stable booking system
- [ ] Clean deployment on Vercel
- [ ] Smooth user experience