import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login       from "./components/login";
import Register    from "./components/register";
import Intro       from "./components/intro";
import ClosetView  from "./components/closet";
import UploadItem  from "./components/upload-item";
import Feed        from "./components/feed";
import Quiz        from "./components/quiz";
import RequireAuth     from "./components/RequireAuth";
import ProtectedLayout from "./components/ProtectedLayout";

import { AuthProvider } from "./contexts/authContext";
import "./components/style.css";

export default function App() {
  //localStorage.removeItem("hasCompletedQuiz"); // REMOVE LATER JUST FOR TESTING
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* public */}
          <Route path="/intro"    element={<Intro />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* protected with layout */}
          <Route element={<RequireAuth />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/"            element={<Feed />} />
              <Route path="/closet"      element={<ClosetView />} />
              <Route path="/upload-item" element={<UploadItem />} />
            </Route>

            {/* protected without layout */}
            <Route path="/quiz" element={<Quiz />} />
          </Route>

          <Route path="*" element={<Navigate to="/intro" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
