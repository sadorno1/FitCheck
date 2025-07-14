import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Register from "./components/register";
import Home from "./components/home";
import ClosetView from "./components/closet";
import UploadItem from "./components/upload-item";
import Sidebar from "./components/sidebar";   // ← new
import { AuthProvider } from "./contexts/authContext";
import "./components/style.css";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper" style={{ display: "flex" }}>
          {/* left‑side navigation */}
          <Sidebar />

          {/* main content */}
          <main className="app-main" style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/closet" element={<ClosetView />} />
              <Route path="/upload-item" element={<UploadItem />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
