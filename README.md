# Vacation Planner

A simple, responsive, fully static vacation planning website that runs locally and can be hosted on GitHub Pages.

## Features

- Password gate on app open (default: `1234`, changeable in-app).
- Create and manage multiple vacations.
- Detailed planning per vacation:
  - Core trip details (destination, dates, travelers, notes)
  - Places to visit (address, maps link, estimated cost, todo, notes)
  - Budget items with remaining budget summary
  - Trip todos with due date + priority + done toggle
  - Bookings and transport details
  - Packing checklist
  - Important contacts
- Data persists in browser `localStorage`.
- Mobile responsive design.

## Run locally

Option 1: open `index.html` directly in your browser.

Option 2 (recommended): start a local static server:

```bash
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

## Host on GitHub Pages

1. Push this repository to GitHub.
2. In GitHub: **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select your default branch and `/ (root)` folder.
5. Save; your site will be live at `https://<username>.github.io/<repo>/`.

## Notes

This is a client-side app. Password and all vacation data are stored locally in your browser. For strong security and shared multi-user access, a backend is required.
