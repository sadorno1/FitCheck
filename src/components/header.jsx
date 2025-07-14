import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header
      style={{
        padding: "20px",
        backgroundColor: "#fef6ff",
        color: "#8e44ad",
        fontFamily: "Avenir, sans-serif",
        textAlign: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "2.5rem" }}>
        ✨ <Link to="/" style={{ textDecoration: "none", color: "#8e44ad" }}>FitCheck</Link> ✨
      </h1>
    </header>
  );
};

export default Header;
