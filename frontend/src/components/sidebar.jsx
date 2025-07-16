// Sidebar.jsx — smart Virtual‑Try‑On link
//----------------------------------------
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useSearchDrawer } from "../contexts/SearchDrawerContext";

import {
  FiHome, FiSearch, FiBox, FiCamera,
  FiBookmark, FiPlusSquare, FiUser
} from "react-icons/fi";

import "./style.css";

const API_ROOT = "http://localhost:5000";

/* ------------ helper to call Flask with ID‑token ----------- */
const auth = getAuth();
const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${idToken}` },
  });
};

const NAV_ITEMS = [
  { label: "Home",      route: "/",        icon: FiHome },
  { label: "Search",    route: "/search",  icon: FiSearch },
  { label: "Post",      route: "/post",    icon: FiPlusSquare },
  { label: "Saved",     route: "/saved",   icon: FiBookmark },
  { label: "My Closet", route: "/closet",  icon: FiBox },
  { label: "Profile",   route: "/Profile", icon: FiUser },
];

export default function Sidebar() {
  const { pathname }  = useLocation();
  const { open }      = useSearchDrawer();
  const navigate      = useNavigate();

  /* handler for Virtual Try‑On */
  const handleTryOn = async () => {
    try {
      const res  = await authedFetch(`${API_ROOT}/avatar`);
      const data = await res.json();
      if (data.avatar) {
        navigate("/try-on");
      } else {
        navigate("/AvatarCreator");
      }
    } catch {
      navigate("/AvatarCreator");
    }
  };

  return (
    <aside className="fc-sidebar">
      <h1 className="fc-logo">FitCheck</h1>

      <nav>
        <ul className="fc-nav">
          {NAV_ITEMS.map(({ label, route, icon: Icon }) => (
            <li key={route}>
              {label === "Search" ? (
                <button
                  onClick={open}
                  className={`fc-link fc-link-button ${
                    pathname === route ? "fc-link--active" : ""
                  }`}
                >
                  <Icon className="fc-icon" />
                  <span>{label}</span>
                </button>
              ) : (
                <Link
                  to={route}
                  className={`fc-link ${
                    pathname === route ? "fc-link--active" : ""
                  }`}
                >
                  <Icon className="fc-icon" />
                  <span>{label}</span>
                </Link>
              )}
            </li>
          ))}

          {/* --- Virtual Try‑On link ---*/}
          <li>
            <button
              onClick={handleTryOn}
              className={`fc-link fc-link-button ${
                pathname === "/try-on" || pathname === "/AvatarCreator"
                  ? "fc-link--active"
                  : ""
              }`}
            >
              <FiCamera className="fc-icon" />
              <span>Virtual Try‑On</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
