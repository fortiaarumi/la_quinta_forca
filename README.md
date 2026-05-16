# La Quinta Forca
> A real-time multiplayer geographic exploration and competitive web application.

La Quinta Forca is an interactive, highly responsive game where players explore dynamic maps and compete in real-time to guess their exact geographic locations. Featuring intense competitive modes, synchronized multiplayer lobbies, and an AI-powered feedback loop, the application delivers a seamless and highly polished user experience.

---

## Core Features

### Real-Time Multiplayer Architecture
Built on a robust real-time database layer, the application supports live room creation, dynamic lobbies, and perfectly synchronized game states. Cross-player timer coordination ensures fairness and prevents desynchronization across all connected clients during intense match sessions.

### Advanced Team Battle Mode
The multiplayer ecosystem scales from 1vs1 duels up to massive 5vs5 team matches. It features aggregate team scoring, automated player shuffling for balanced teams, and custom responsive UI cards designed to keep the action readable and engaging across all screen sizes.

### AI-Powered Satirical Content
The game integrates an advanced AI-driven feedback loop that evaluates player accuracy. Depending on how close (or far) a player's guess is, the system generates custom satirical songs and humorous feedback, dynamically adjusting to their performance and current game state.

### Progressive Web App (PWA)
La Quinta Forca is fully optimized as a Progressive Web App, offering a seamless, installable mobile experience. It includes advanced safe-area notch handling, anti-overlap ad and UI barriers, and custom responsive layouts that ensure zero layout shifts during critical gameplay moments.

### Resilient UX Guards
To protect the competitive integrity of the game, custom window history and state interception mechanisms are implemented. These guards prevent accidental page refreshes (F5) or unintended mobile back-button navigation during active gameplay. Furthermore, a smart mid-game reconnection loop allows players to recover their sessions if they are momentarily disconnected.

---

## Tech Stack

### Frontend
- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Library**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### Backend & Database
- **Realtime Database**: [Firebase Realtime Database](https://firebase.google.com/docs/database)
- **Document Store**: [Firebase Firestore](https://firebase.google.com/docs/firestore)

### APIs & Integrations
- **Maps**: [Google Maps API](https://developers.google.com/maps) (Street View & Maps JavaScript API)

---

## Getting Started

Follow these steps to set up the project locally:

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and configure the necessary environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
*(Make sure to replace the placeholder values with your actual API keys).*

### 3. Running the Development Server
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
