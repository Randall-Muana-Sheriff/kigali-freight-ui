# Kigali Freight Control Tower - Frontend

This is the command center interface for the Kigali Freight Control Tower, a real-time geospatial optimisation platform designed for fleet management and logistics dispatch in Kigali.

## 🚀 Overview
The frontend provides dispatchers with a real-time view of fleet assets, incident registries, and automated routing capabilities. Built with React and Leaflet, it bridges the gap between raw GPS data and actionable intelligence.

## 🛠 Tech Stack
- **Framework:** React.js (Vite)
- **Mapping:** Leaflet.js
- **State Management:** React Hooks (Context API/Zustand)
- **Communication:** Socket.io-client
- **Styling:** Tailwind CSS

## ✨ Key Features
- **Real-Time Map Engine:** Live tracking of assets across Kigali.
- **Incident Registry:** Instant monitoring of speed and geofence breaches.
- **Dispatch Matrix:** Automated route calculation and driver ranking using OSRM.
- **Interactive Geofencing:** Tools to define and manage operational boundaries.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   
    npm install
   
  Start the development server:
  
      npm run dev
