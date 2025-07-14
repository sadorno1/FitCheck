// src/components/ProtectedLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import "./style.css";

export default function ProtectedLayout() {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="app-main">
        <Outlet />                    {}
      </main>
    </div>
  );
}
