# Vacation Planner

A polished, responsive, fully static vacation planning website that runs locally and can be hosted on GitHub Pages.

## Highlights

- Password gate on app open (default `1234`, changeable in-app).
- Multi-vacation dashboard with modern UI/UX and responsive layout.
- Detailed planning per vacation:
  - Core trip details (destination, dates, travelers, goals)
  - Places to visit (address, maps link, estimated cost, todos, notes)
  - Budget tracking (planned vs remaining)
  - Trip todos with due date/priority and completion toggle
  - Bookings and transportation records
  - Packing checklist
  - Important contacts
- Data persistence with browser `localStorage`.

## Run locally

Option 1: Open `index.html` directly in your browser.

Option 2 (recommended): start a static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Host on GitHub Pages

1. Push repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select your default branch and `/ (root)`.
5. Save. Your URL will be: `https://<username>.github.io/<repo>/`.

## Security note

This app is client-side only. Password and vacation data are stored in browser storage (local device/browser profile), not on a secure backend.
