# Vacation Planner (Professional Dashboard + JSON Storage)

A polished, responsive vacation planning web app with a local Node server and JSON-file storage, so your plans can be shared across multiple devices.

## What changed

- High-end, minimalistic dashboard UI for managing multiple vacations.
- Data is now persisted in JSON files:
  - `data/vacations.json`
  - `data/settings.json`
- Password gate is server-backed (`settings.json`) so all connected devices use the same password.
- Manual + auto sync to the JSON backend API.

## Run locally

```bash
npm start
```

Then open:

- `http://localhost:3000`

## Multi-device usage

To use multiple devices:

1. Run this app on one machine/server that is always online.
2. Make sure that machine is reachable on your network (or internet).
3. Open `http://<server-ip>:3000` from your other devices.
4. All devices read/write the same JSON files on that server.

## Project structure

- `index.html` — UI and layout
- `styles.css` — responsive styling and components
- `app.js` — frontend logic + API sync
- `server.js` — lightweight Node HTTP API + static hosting
- `data/vacations.json` — shared planner data
- `data/settings.json` — shared password

## Notes

- This is not end-to-end encrypted and not production-auth hardened.
- For internet exposure, put this behind HTTPS + proper authentication.
