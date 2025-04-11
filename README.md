# FuelWise

**FuelWise** is a mobile application developed using React Native and Expo. It enables drivers to locate the cheapest fuel and EV charging stations nearby, track their monthly fuel costs, calculate journey expenses based on actual route distance, and gain insights into their spending habits. This project was developed as part of a final year BSc Computer Science degree at the University of Bedfordshire.

---

## Features

- Interactive map to locate nearby petrol, diesel, and EV charging stations
- Filter stations by fuel type (petrol, diesel, EV), price, or distance
- Station detail view with opening hours and navigation options (Google Maps, Waze, Apple Maps)
- Log and track monthly fuel or EV charging receipts
- Visualise monthly spending using bar charts
- Journey cost calculator that considers:
  - Car fuel efficiency (mpg or miles/kWh)
  - Driving type (urban, motorway, mixed)
  - Actual route distance (using geolocation + directions API)
- Suggested cost-per-litre or kWh based on selected fuel type
- Recently used cars saved for quick selection
- Consistent dark/cream/purple UI theme with modern component styling

---

## Installation & Setup

To run the app locally on your machine:

### Prerequisites

- **Node.js** and **npm** installed
- **Expo CLI** installed globally:
  ```bash
  npm install -g expo-cli
Expo Go app installed on your mobile device

Steps
Clone the repository:

bash
Copy
Edit
git clone https://github.com/pride9x/FuelWise.git
cd FuelWise
Install project dependencies:

bash
Copy
Edit
npm install
Install required libraries (if not already installed):

bash
Copy
Edit
expo install react-native-maps
expo install react-native-paper
expo install react-native-chart-kit
expo install @react-native-async-storage/async-storage
expo install @gorhom/bottom-sheet
expo install expo-location
expo install axios
expo install react-native-modal
Start the development server:

bash
Copy
Edit
npx expo start
Run on your phone:

Open the Expo Go app on your Android or iOS device.

Scan the QR code displayed in the terminal or browser.

The app will launch directly on your phone.

Future Improvements
The app has significant potential to evolve into a full-featured personal fuel management system. Planned and suggested improvements include:

Historic Fuel Trend Analysis: Track price changes over time and display graphs showing past trends for petrol, diesel, and EV charging.

Fuel Price Forecasting: Incorporate machine learning models to predict future fuel prices based on oil markets and historical data.

Vehicle Registration Lookup: Allow users to input their UK license plate to fetch vehicle fuel efficiency details (via DVLA API).

Live Price Data Integration: Replace sample station data with real-time prices via third-party APIs.

Cloud Backup and Authentication: Store receipts, journey logs, and settings in the cloud with login functionality.

Offline Mode: Enable cached access to station data, saved cars, and journey calculator features for areas with no internet access.

Author
Andrei-Eduard Trifan
BSc Computer Science – Final Year Project
University of Bedfordshire, 2025
Supervisor: Dr Shabnam Kadir
