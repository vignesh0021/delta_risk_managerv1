# Delta Exchange Trading Bot

A mobile trading bot interface for Delta Exchange, built with Python (FastAPI) backend and React Native (Expo) mobile app. Features automated trading engines with configurable strategies and real-time position management.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Mobile App (Expo)              │
│         React Native + TypeScript           │
│   Trading UI │ Portfolio │ Engine Config    │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│           Backend Server (FastAPI)           │
│            Python 3.11+                      │
├─────────────────────────────────────────────┤
│  Auth │ Engine Manager │ Delta API Client    │
├─────────────────────────────────────────────┤
│              Trading Engines                │
│  Grid │ DCA │ Momentum │ Mean Reversion     │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────┐
│          Delta Exchange API                  │
│      Futures │ Perpetuals │ Options          │
└─────────────────────────────────────────────┘
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Expo CLI
- Delta Exchange API keys
- Android Studio (for local APK build)

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your keys
python main.py
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DELTA_API_KEY` | Your Delta Exchange API key |
| `DELTA_API_SECRET` | Your Delta Exchange API secret |
| `JWT_SECRET` | Secret key for JWT authentication |
| `FIREBASE_KEY` | Firebase credentials for push notifications |

## GitHub Actions

1. Go to your repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `DELTA_API_KEY`
   - `DELTA_API_SECRET`
   - `JWT_SECRET`
   - `FIREBASE_KEY`
3. Push to `main` branch to trigger APK build
4. Download the APK from the Actions > Artifacts section

## APK Download

1. Navigate to Actions tab in the GitHub repository
2. Click on the latest successful workflow run
3. Scroll to Artifacts section
4. Download `delta-exchange-apk`
5. Extract and install the APK on your Android device

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Register new user |
| GET | `/engines` | List all trading engines |
| POST | `/engines` | Create a new engine |
| PUT | `/engines/{id}` | Update engine configuration |
| DELETE | `/engines/{id}` | Delete an engine |
| POST | `/engines/{id}/start` | Start an engine |
| POST | `/engines/{id}/stop` | Stop an engine |
| GET | `/positions` | Get open positions |
| GET | `/portfolio` | Get portfolio summary |
| GET | `/orders` | Get order history |
| GET | `/market/{symbol}` | Get market data |
| GET | `/health` | Health check |

## Trading Engines

### Grid Trading
Places buy and sell orders at predefined price levels around a base price. Profits from price oscillation within a range. Best for sideways markets.

### DCA (Dollar Cost Averaging)
Automatically buys at regular intervals regardless of price. Reduces average entry cost over time. Suitable for long-term accumulation.

### Momentum
Identifies trending markets and enters positions in the direction of the trend. Uses RSI, MACD, and moving averages for signal generation.

### Mean Reversion
Trades against extreme price movements, betting on return to average. Uses Bollinger Bands and RSI to identify overbought/oversold conditions.

## Adjustment Types

| Type | Description |
|------|-------------|
| `fixed` | Static value, no automatic changes |
| `percentage` | Adjusts by a fixed percentage on trigger |
| `trailing` | Follows price direction with a set offset |
| `dynamic` | Adapts based on volatility and market conditions |

## Security

- API keys are stored server-side, never exposed to the mobile app
- All API communication uses HTTPS
- JWT tokens expire after 24 hours
- Rate limiting is enforced on all endpoints
- Input validation on all user-provided parameters
- CORS restricted to known origins

## License

MIT
