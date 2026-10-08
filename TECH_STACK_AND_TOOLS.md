# DayGuide: Tech Stack & Development Tools Guide
**Architecture Selection: React Native / Expo (TypeScript)**

---

## 1. Selected Technology Stack Overview

Based on your selection, **DayGuide** will be built using **React Native with Expo (TypeScript)**. This setup satisfies:
1. **Direct Android Deployment:** Easily testable instantly via Expo Go or compiled into a standalone `.apk` using EAS Build or local Gradle.
2. **Web Companion Support:** Expo natively compiles to Web (`npx expo start --web`), fulfilling the `(Mobile + Web)` capability outlined in the PRD.
3. **Phase-Gated Development:** Phase 1 focuses purely on core offline-first features (SQLite + Local Notifications + Today Cockpit); Phase 2 unlocks the AI planning assistant (Gemini API).

---

## 2. Comprehensive Tool & Library Breakdown

### 2.1 Core Framework & Language
- **Runtime & Tooling:** Expo SDK 51+ / React Native 0.74+
- **Language:** TypeScript 5.x (Strict type safety for schedule intervals, time math, and database models)
- **App Navigation:** `expo-router` (File-based typed routing, similar to Next.js) or `@react-navigation/native`

### 2.2 Local Storage & Offline Database (P0)
- **Primary Database:** `expo-sqlite` (next-generation synchronous/asynchronous SQLite API for React Native).
  - High performance, fully local on-device SQLite database.
  - Zero cloud dependencies or backend servers needed for MVP.
- **Key-Value Preferences:** `expo-secure-store` / `@react-native-async-storage/async-storage` (for app settings, onboarding status, optional biometric lock).

### 2.3 Notifications & Background Alarms (P0)
- **Local Notifications:** `expo-notifications`
  - Schedules local daily alarms and lead-time reminders without any remote push server.
  - Actionable notifications on Android (Done, Snooze, Re-plan action buttons).
  - Android Notification Channels with high importance (sound, heads-up display, vibration).
- **Background Tasks:** `expo-task-manager` & `expo-background-fetch` for periodic schedule integrity checks.

### 2.4 UI, Aesthetics & Animation
- **Icons:** `lucide-react-native` or `@expo/vector-icons` (clean modern icons for tasks, categories, and calendar navigation).
- **Smooth Animations:** `react-native-reanimated` (for high-refresh-rate circular timers, smooth card transitions, and progress rings).
- **Haptic Feedback:** `expo-haptics` (crisp physical feedback when completing blocks or pressing snooze).
- **Date & Time Utilities:** `date-fns` (lightweight, modular time manipulation and duration math).

### 2.5 Phase 2 AI Integration Layer
- **LLM Engine:** Google Gemini API (`@google/genai` or direct REST API via fetch).
- **Model:** `gemini-1.5-flash` / `gemini-2.5-flash` with JSON Schema constraint mode.
- **Workflow:** User inputs free-form text -> Gemini parses intent and returns structured JSON timetable modifications -> User reviews and applies changes.

---

## 3. Development Tools & Prerequisites Checklist

To build and run DayGuide on your Windows development environment:

### Required Software
| Tool | Purpose | Install Command / Source |
| :--- | :--- | :--- |
| **Node.js (LTS v20+)** | JavaScript/TypeScript runtime | `winget install OpenJS.NodeJS.LTS` |
| **Git** | Source code version control | `winget install Git.Git` |
| **Expo CLI** | Project runner and bundler | Bundled with `npx expo` |
| **EAS CLI** | Cloud/local APK building tool | `npm install -g eas-cli` |
| **Expo Go App** (on phone) | Instant wireless test on your Android phone | Install from Google Play Store on your phone |
| **Android Studio / SDK** (optional) | For local direct USB compilation / emulator | [developer.android.com/studio](https://developer.android.com/studio) |

---

## 4. App Directory & Project Structure (Expo Router)

```text
dayguide/
├── app/                          # Expo Router navigation screens
│   ├── (tabs)/                   # Bottom tab bar layout
│   │   ├── index.tsx             # Today Screen ("The Cockpit" - Now/Next/Timer)
│   │   ├── timetable.tsx         # Day / Week / Month Calendar View
│   │   ├── habits.tsx            # Habit Streaks & Unscheduled Task Drawer
│   │   └── settings.tsx          # Profile, Archetypes, Backup & Export
│   ├── ai-coach.tsx              # Phase 2: AI Planning Assistant Screen
│   ├── onboarding.tsx            # First-time questionnaire & template selection
│   ├── modal-edit-block.tsx      # Time block inspector / editor modal
│   └── _layout.tsx               # Root layout, theme provider & DB init
├── src/
│   ├── db/                       # Local SQLite schema, migrations & queries
│   │   ├── database.ts           # expo-sqlite initialization
│   │   ├── schema.ts             # Tables: profiles, time_blocks, habits, logs
│   │   └── queries.ts            # CRUD operations & streak computations
│   ├── services/                 # Core domain services
│   │   ├── notificationService.ts# expo-notifications scheduling & actions
│   │   ├── replanService.ts      # Conflict resolution & dynamic re-planner
│   │   └── backupService.ts      # JSON & .ics import/export
│   ├── components/               # Reusable modular UI components
│   │   ├── NowHeroCard.tsx       # Active block card with live countdown timer
│   │   ├── NextBlockCard.tsx     # Upcoming block preview
│   │   ├── ProgressRing.tsx      # Daily completion dial
│   │   ├── TimelineGrid.tsx      # Vertical 24h interactive timeline
│   │   └── HabitCard.tsx         # Habit streak counter and weekly dots
│   ├── hooks/                    # Custom React hooks (useSchedule, useActiveBlock)
│   └── constants/                # Colors, categories, default templates
├── app.json                      # Expo config (permissions, package name)
├── package.json
└── tsconfig.json
```

---

## 5. Development & APK Deployment Workflows

### 5.1 Instant Testing on Your Android Phone (Zero Cable / Wireless)
1. Install **Expo Go** from the Play Store on your Android phone.
2. Run in terminal:
   ```bash
   npx expo start
   ```
3. Scan the QR code shown in the terminal with your phone’s camera or the Expo Go app.
4. The app runs instantly with live fast-refresh as you code!

### 5.2 Building Standalone Android APK (No Google Play Store Needed)
When ready to install as a permanent standalone app on your phone:

**Option 1: EAS Cloud Build (Easiest, builds APK in the cloud):**
```bash
# 1. Login to free Expo account
npx eas login

# 2. Configure build profile for direct APK
# (In eas.json: set "buildType": "apk")
npx eas build:configure

# 3. Build standalone APK
npx eas build --platform android --profile preview
```
EAS outputs a direct download link and QR code to download `DayGuide.apk` straight onto your phone.

**Option 2: Local Standalone Build (via local Android SDK):**
```bash
npx expo run:android --variant release
```
Outputs the release APK directly in `android/app/build/outputs/apk/release/`.
