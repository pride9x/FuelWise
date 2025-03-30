# 🛠️ FuelFinder App

**FuelFinder** is a powerful mobile application built with React Native + Expo that helps users find the cheapest nearby fuel stations and EV chargers, calculate journey costs, track fuel receipts, and analyze monthly fuel spending.

---

## 🚀 Features

### 🗺️ Interactive Fuel Map
- View nearby **petrol stations and EV chargers**
- Tap on markers to see prices, address, opening hours, and get directions via:
  - Google Maps
  - Apple Maps (iOS)
  - Waze

### 💸 Journey Cost Calculator
- Select a car from a sample list with **MPG or miles/kWh**
- Choose **driving type** (Urban / Mixed / Motorway) to improve accuracy
- Input **start & destination** (auto-calculates route distance via Google Maps API)
- Calculates total journey cost with a detailed breakdown
- Remembers recently used cars for quick selection

### 🧾 Fuel / EV Receipt Tracker
- Add fuel or charging receipts
- Select station name from searchable list
- Enter fuel type, price per litre/kWh, and total cost
- Calculates litres or kWh used
- Editable receipt entries with delete support

### 📊 Monthly Spending Logs
- Filter logs by **month and fuel type**
- View **bar chart** of monthly spending
- Export data to **CSV or PDF**
- Clear logs by month or fuel type

---

## 📂 Project Structure

```
app/
├── cheapest.js         # Find cheapest fuel by type and distance
├── journey.js          # Journey cost calculator
├── logs.js             # Spending log screen with charts and filters
├── map.js              # Interactive map screen with BottomSheet & modal
├── receipts.js         # Fuel & EV receipt tracking
├── index.js            # Home screen with animated logo & navigation
├── carData.json        # Sample cars with efficiency data
├── stations.json       # Fuel & EV station data with prices & opening hours
└── config.js           # Contains API keys (e.g., Google Maps)
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js, Expo CLI
- Google Maps API Key (with Geocoding & Directions API enabled)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/FuelFinderApp.git
cd FuelFinderApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your API key

Create a file: `app/config.js`

```js
export const GOOGLE_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

### 4. Start the app

```bash
npx expo start
```

---

## 🖌️ Theming

The app uses a stylish and accessible color palette:

- **Purple:** `#785589`
- **Black:** `#1A1A1A`
- **Cream:** `#DBC4A7`
- **Rose Red:** `#D60D13`

All screens follow a consistent theme with cream backgrounds and purple accents.

---

## 📱 Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [Google Maps API](https://developers.google.com/maps/documentation)

---

## 💡 Future Enhancements

- User authentication
- Real-time fuel price updates via API
- Live EV charger availability
- Car profile management
- Dark mode and localization support

---

## 📸 Screenshots

*Include images of key screens here once you're ready.*

---

## 📜 License

This project is licensed under the MIT License.