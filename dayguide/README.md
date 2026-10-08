# DayGuide (Android & Cross-Platform)
> Proactive Daily Routine Coach App built with React Native & Expo (TypeScript).

---

## 🚀 Quick Start: Run on Your Android Phone

### 1. Wireless Preview via Expo Go (Fastest)
1. Install **Expo Go** from Google Play on your Android phone.
2. In this folder (`dayguide`), run:
   ```bash
   npm start
   # or
   npx expo start
   ```
3. Open your phone camera or the Expo Go app and scan the QR code displayed in your terminal.
4. The app boots immediately with full fast-refresh!

---

### 2. Run in Web Browser
```bash
npm run web
```
*(Note: Web mode runs SQLite in-memory and simulates notifications).*

---

### 3. Build Standalone Android APK (No Play Store Required)
To produce a `.apk` file you can install permanently on your Android phone:

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to your free Expo account
eas login

# 3. Build APK
eas build -p android --profile preview
```
Download the resulting `.apk` link to your phone and tap install.

---

## 📱 Implemented Features (Phase 1 MVP)

- **Proactive Today Screen ("The Cockpit"):**
  - Live **Now Hero Card** with real-time countdown timer of minutes remaining in active block.
  - Action buttons: `[✓ Mark Done]`, `[+10m Snooze]`, `[Skip]` with native haptic feedback.
  - **Up Next Preview** showing upcoming block transition countdown.
  - **Rhythm Progress Bar** tracking completed vs. scheduled blocks for today.
  - Remaining day chronological timeline.
- **Interactive Timetable:**
  - 7-day selector (Sun – Sat) with total hours calculated per day.
  - Conflict warning banner detecting overlapping time slots.
  - Block creation and editing modal (Categories, priorities P0/P1/P2, fixed anchors vs. flexible).
- **Habit & Streak Tracker:**
  - Daily habit cards with flame streak counters (🔥).
  - Single-tap daily check-in with streak auto-incrementing.
  - Custom habit creation.
- **Local SQLite Database (`expo-sqlite`):**
  - Fully offline, on-device SQLite database (`dayguide.db`).
  - Tables for `profile`, `categories`, `time_blocks`, `habits`, and `completion_logs`.
  - Zero cloud dependencies or telemetry.
- **Smart Local Reminders (`expo-notifications`):**
  - Android high-priority channel (`routine-reminders`).
  - Daily scheduled local reminders.
  - Test notification trigger in Settings.
- **Guided Onboarding & Archetypes:**
  - 3 starter templates: *Freelancer & Creator*, *Student & Academic*, and *Balanced Rhythm*.
  - Configurable sleep anchors (Wake & Bedtime targets).
  - Data backup & JSON export.
