# TempoUp Mobile

React Native + Expo app (TypeScript) for **TempoUp** — the sport-partner matching platform.
Royal-blue themed, supports light + dark mode following the system setting.

## Tech stack
- Expo SDK 51 (Expo Go-compatible — no custom native code)
- TypeScript
- React Navigation (stack + bottom tabs)
- @stomp/stompjs over native WebSocket for real-time chat
- expo-secure-store for JWT persistence
- PanResponder + Animated for the swipe deck (no extra native deps)

## Quick start
```bash
npm install
npx expo start
```
Scan the QR with the Expo Go app on your phone (or press `a` for Android emulator, `i` for iOS simulator).

## Backend URL — important
The default API base URL is `http://10.0.2.2:8080`, which works **only for the Android emulator** (it's how the emulator reaches your host's `localhost`).

For other setups, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL` and
`EXPO_PUBLIC_WS_BASE_URL`. These are loaded by `app.config.js` (via `dotenv`) into
`expo.extra` and read in `src/api/client.ts`:

| Running on              | EXPO_PUBLIC_API_BASE_URL         | EXPO_PUBLIC_WS_BASE_URL         |
|-------------------------|----------------------------------|---------------------------------|
| Android emulator        | `http://10.0.2.2:8080`           | `ws://10.0.2.2:8080`            |
| iOS simulator           | `http://localhost:8080`          | `ws://localhost:8080`           |
| Physical phone (Expo Go)| `http://<your-pc-LAN-IP>:8080`   | `ws://<your-pc-LAN-IP>:8080`    |

Find your LAN IP with `ipconfig` (Windows) / `ifconfig` (mac/linux). You'll see something like `192.168.1.42`.

> Restart `expo start` after changing `.env` — env vars are read at config-load time.

You also need the backend's CORS to allow your Expo dev origin — the supplied `application.yml` already permits `localhost`, `127.0.0.1`, and `exp://` schemes.

## Project layout
```
App.tsx
src/
  api/           HTTP client + typed endpoint functions
  auth/          AuthContext + SecureStore-backed token storage
  chat/          STOMP WebSocket client
  components/    Screen, Button, TextField, Chip, Avatar
  navigation/    Root navigator + auth/main stacks + bottom tabs
  screens/       Login, Register, Discovery (swipe), Matches,
                 Conversation (real-time chat), Profile,
                 MySports, SportPicker
  theme/         Royal-blue light + dark palettes, ThemeProvider
  types/         TypeScript mirrors of the backend DTOs
```

## Theme
Primary: `#1E3A8A` (royal blue), accent `#4169E1`, deep `#002366`.
Switches automatically with the system light/dark setting.

## Auth flow
1. Login/Register → backend returns access + refresh tokens
2. Tokens stored in `expo-secure-store`
3. Every authed request adds `Authorization: Bearer <access>`
4. On any 401, the client transparently refreshes once and retries
5. If the refresh itself fails, the user is signed out

## Notes / next steps
- The swipe deck is a clean PanResponder implementation — no `react-native-deck-swiper` dependency to break.
- The chat uses real STOMP over WS; the conversation screen also has a REST fallback if the WS isn't ready when the user sends.
- No image picker yet; `photoUrl` is just stored as a string.
- For production builds outside Expo Go, run `npx expo prebuild` and switch to EAS Build.
