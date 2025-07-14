import React from "react";
import { Link } from "react-router-dom";
import { IoShirtOutline } from "react-icons/io5"; 
import "./style.css"; 

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <IoShirtOutline className="header-icon" />
        <span className="header-text">FitCheck</span>
      </Link>
    </header>
  );
};

export default Header;
