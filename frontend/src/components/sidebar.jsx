import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSearchDrawer } from "../contexts/SearchDrawerContext"; 

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
  { label: "Home",           route: "/",             icon: FiHome },
  { label: "Search",         route: "/search",       icon: FiSearch },
  { label: "Post",           route: "/post",  icon: FiPlusSquare }, 
  { label: "Saved",          route: "/saved",        icon: FiBookmark },
  { label: "My Closet",      route: "/closet",       icon: FiBox },
  { label: "Virtual Try‑On", route: "/AvatarCreator",       icon: FiCamera },
  { label: "Profile",        route: "/try-on",      icon: FiUser },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { open } = useSearchDrawer();

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
                  className={
                    `fc-link ${pathname === route ? 'fc-link--active' : ''} fc-link-button`
                  }
                >
                  <Icon className="fc-icon" />
                  <span>{label}</span>
                </button>
              ) : (
                <Link
                  to={route}
                  className={
                    pathname === route ? "fc-link fc-link--active" : "fc-link"
                  }
                >
                  <Icon className="fc-icon" />
                  <span>{label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
