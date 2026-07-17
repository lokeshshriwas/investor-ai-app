# Investor AI - Frontend QA Checklist

> Run through this checklist before each release or demo.  
> Backend must be running at `http://localhost:8000` for most tests.

---

## Setup

```bash
# Terminal 1: start backend
cd backend
.\venv\Scripts\uvicorn.exe main:app --reload

# Terminal 2: start frontend
cd frontend
npm run dev
```

---

## 1. Full Click-through - All 5 Investors

For each investor key: `buffett`, `lynch`, `graham`, `munger`, `dalio`

| Step | Expected | Pass |
|------|----------|------|
| Visit `http://localhost:3000` | Landing page loads; hero + 3 feature cards visible | ☐ |
| Click "Choose Your Investor →" | Navigates to `/investors` | ☐ |
| Investor grid shows 5 cards | All 5 legends visible with emoji, risk badge, philosophy | ☐ |
| Click Buffett card | Navigates to `/screener/buffett` | ☐ |
| Screener shows up to 10 stocks | Stocks have symbol, name, score 0-100, sector pill | ☐ |
| Stocks sorted highest score first | Top stock has higher score than 10th | ☐ |
| Click a stock card | Navigates to `/stock/SYMBOL.NS` | ☐ |
| Stock detail page loads | Shows 8 metric stat blocks, Pros ✓ (green), Cons ✗ (red) | ☐ |
| "Chat about this stock" button visible | Button present in header if investor context exists | ☐ |
| Click chat button | Navigates to `/chat/buffett?stock=SYMBOL.NS` | ☐ |
| Chat header shows stock context | "discussing SYMBOL" visible below investor name | ☐ |
| Starter questions visible | 3 clickable prompt buttons on welcome screen | ☐ |
| Click a starter question | Message appears; loading indicator shown; reply received | ☐ |
| Type custom message + Enter | Sends message; assistant responds | ☐ |
| Repeat for Lynch, Graham, Munger, Dalio | All work identically | ☐ |

---

## 2. Backend Unreachable - Graceful Degradation

Start frontend WITHOUT starting backend.

| Page | Expected | Pass |
|------|----------|------|
| `/screener/buffett` | Error message shown (not blank screen, not crash) | ☐ |
| `/screener/buffett` | Shows message pointing to backend URL | ☐ |
| `/stock/RELIANCE.NS` | Error message shown; back link present | ☐ |
| `/chat/buffett` - send message | Inline error shown below input; app does not crash | ☐ |
| Chat error is dismissable | Sending a new message clears the previous error | ☐ |

---

## 3. Unknown / Invalid URL Parameters

| URL | Expected | Pass |
|-----|----------|------|
| `/screener/soros` | "Unknown investor" message; back link to `/investors` | ☐ |
| `/screener/BUFFETT` (uppercase) | Same error (keys are case-sensitive) | ☐ |
| `/stock/FAKESTOCK999` | "Stock not found" message (not 500 or blank) | ☐ |
| `/chat/soros` | "Unknown investor" message; back link | ☐ |
| `/investors` with no backend | Page loads fine (static, no API calls on this page) | ☐ |

---

## 4. Auth Pages

| Step | Expected | Pass |
|------|----------|------|
| Visit `/login` | Login form renders with email + password | ☐ |
| Submit empty form | Browser validation prevents submission | ☐ |
| Submit wrong password | Inline error shown below form | ☐ |
| Successful login | Redirects to `/investors` | ☐ |
| Visit `/signup` | Signup form renders | ☐ |
| Submit < 6 char password | Browser validation prevents (minLength=6) | ☐ |
| Successful signup | Redirects to `/investors` | ☐ |

---

## 5. Mobile Responsiveness (375px width)

Use browser DevTools → 375px × 812px (iPhone SE).

| Page | Expected at 375px | Pass |
|------|-------------------|------|
| Landing (`/`) | Hero text readable; CTA button full-width | ☐ |
| Investor grid (`/investors`) | Cards stack to 1 column | ☐ |
| Screener (`/screener/buffett`) | Stock cards readable; metrics wrap gracefully | ☐ |
| Stock detail (`/stock/RELIANCE.NS`) | Stat grid wraps; pros/cons stack vertically | ☐ |
| Chat (`/chat/buffett`) | Input + Send button visible; messages fit width | ☐ |
| Login/Signup | Form fits screen; no horizontal overflow | ☐ |

---

## 6. Disclaimer Footer

| Check | Expected | Pass |
|-------|----------|------|
| Footer visible on landing page | Disclaimer text present | ☐ |
| Footer visible on screener | Present on all pages using root layout | ☐ |
| Chat page full-height layout | Footer may be hidden (chat uses full-height flex) - acceptable | ☐ |

---

## 7. Performance Sanity

| Check | Acceptable | Pass |
|-------|------------|------|
| Screener page load time (backend warm) | < 2s | ☐ |
| Stock detail page load time | < 5s (LLM call is synchronous) | ☐ |
| Chat first reply time (Groq API) | < 5s | ☐ |

---

## Known Limitations

- **Groq API key**: The `GROQ_API_KEY` in `backend/.env` must be updated with a valid key from [console.groq.com/keys](https://console.groq.com/keys) before LLM features work.
- **Supabase schema**: `backend/data/schema.sql` must be run in the Supabase SQL Editor before auth persists user sessions properly.
- **Chat page**: Footer is not shown on the chat page by design (full-height layout).
- **Stock detail**: The "Chat about this stock" button only appears if the user arrives from a screener page (investor context in URL).
