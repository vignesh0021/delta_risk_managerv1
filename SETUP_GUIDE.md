# Setup Guide

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/delta-exchange-bot.git
cd delta-exchange-bot
cp .env.example .env
```

## 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Edit `.env` in the project root:

```
DELTA_API_KEY=your_actual_api_key
DELTA_API_SECRET=your_actual_api_secret
JWT_SECRET=generate_a_strong_random_string
FIREBASE_KEY=your_firebase_credentials_json
```

Start the server:

```bash
python main.py
```

Server runs at `http://localhost:8000`. Verify with `curl http://localhost:8000/health`.

## 3. Mobile Setup

```bash
cd mobile
npm install
npx expo start
```

Install Expo Go on your Android phone from the Play Store. Scan the QR code displayed in the terminal.

For iOS, use the Expo Go app from the App Store.

## 4. Delta Exchange API Keys

1. Log in to [Delta Exchange](https://www.delta.exchange)
2. Navigate to API Management in account settings
3. Create a new API key pair
4. Enable trading permissions (read + trade)
5. Copy the API key and secret to your `.env` file
6. Never share or commit API secrets

## 5. Enable GitHub Actions

1. Push your code to a GitHub repository
2. Go to Settings > Secrets and variables > Actions
3. Click "New repository secret" for each:
   - `DELTA_API_KEY` = your API key
   - `DELTA_API_SECRET` = your API secret
   - `JWT_SECRET` = your JWT secret
   - `FIREBASE_KEY` = your Firebase key
4. Go to Actions tab and enable workflows

## 6. Build APK

### Automatic (via GitHub Actions)

Push to `main` branch:

```bash
git add .
git commit -m "Build APK"
git push origin main
```

Wait for the workflow to complete. Download the APK from Actions > Artifacts.

### Manual (local build)

Requires Android Studio installed.

```bash
cd mobile
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

APK is at `mobile/android/app/build/outputs/apk/release/app-release.apk`.

## 7. Install on Phone

1. Transfer the APK to your Android device
2. Open the file and allow installation from unknown sources
3. Install the application
4. Open the app and proceed to login

## 8. First Time Setup

1. Launch the app
2. Enter your backend server URL (e.g., `https://your-server.com` or local IP)
3. Register a new account or log in
4. The app connects to the backend and fetches your portfolio
5. Navigate to Engines to create your first trading bot
6. Select engine type, configure parameters, and activate
7. Monitor positions and P&L from the dashboard
