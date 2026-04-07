# FamilyTrip Web Application

A full-stack React + Node.js application for coordinating family road trips with real-time location mapping, emergency SOS, and active trip planning.

## Prerequisites
- **Node.js**: v16+ recommended
- **MongoDB**: A MongoDB Atlas connection string (or a local MongoDB instance running on port 27017)

---

## 🚀 1. Setup the Backend

1. **Open a new terminal** and navigate into the `Backend` directory:
   ```bash
   cd Backend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a new file named `.env` inside the `Backend` folder with the following contents. *(Replace the `MONGO_URI` with your actual MongoDB Atlas connection string!)*
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/familytrip?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *You should see a message saying "MongoDB connected" and "Server running on port 5000".*

---

## 💻 2. Setup the Frontend

1. **Open a second terminal window** and navigate into the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a new file named `.env` inside the `Frontend` folder with the following line:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```
   *This will launch the application locally, typically on `http://localhost:5173`. Click the link provided in the terminal to open it in your browser!*

---

## 🛠 Features Included
- **Authentication**: JWT-based login + Registration.
- **Family Groups**: Automatically generate 6-character, alphanumeric invite codes or join existing families.
- **Trip Planner**: A complete Collaborative CRUD planner featuring vertical RoadMap timelines.
- **Live Location Tracking**: Uses `Navigator.geolocation` & Leaflet JS to visualize exact physical locations in real-time onto custom Teardrop pins.
- **Silent SOS Broadcasts**: Instantly emits a websocket packet bypassing SQL/NoSQL locking protocols to play a Red Alert Banner + Audible Beep to all group participants.
