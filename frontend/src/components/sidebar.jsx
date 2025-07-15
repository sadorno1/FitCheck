import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiBox,          // closet
  FiCamera,       // virtual try‑on
  FiBookmark,     // saved
  FiPlusSquare,   // post
  FiUser          // profile
} from "react-icons/fi";
import "./style.css";   
const NAV_ITEMS = [
  { label: "Home",           route: "/",           icon: FiHome },
  { label: "Search",         route: "/quiz",     icon: FiSearch },
  { label: "Post",           route: "/",icon: FiPlusSquare },
  { label: "Saved",          route: "/saved",      icon: FiBookmark },
  { label: "My Closet",      route: "/closet",     icon: FiBox },
  { label: "Virtual Try‑On", route: "/try-on",     icon: FiCamera },
  { label: "Profile",        route: "/profile",    icon: FiUser },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fc-sidebar">
      <h1 className="fc-logo">FitCheck</h1>

      <nav>
        <ul className="fc-nav">
          {NAV_ITEMS.map(({ label, route, icon: Icon }) => (
            <li key={route}>
              <Link
                to={route}
                className={
                  pathname === route ? "fc-link fc-link--active" : "fc-link"
                }
              >
                <Icon className="fc-icon" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
