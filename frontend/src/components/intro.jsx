import React from "react";
import { useNavigate } from "react-router-dom";
import "./style.css"; 

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">FitCheck</h1>
        <p className="home-subtitle">
          Post your OOTDs, explore outfit inspo, and become your own fashion expert —
          all in one digital closet. Log in or create your profile to get started. 
        </p>
        <div className="home-buttons">
          <button className="home-button login" onClick={() => navigate("/login")}>Log In</button>
          <button className="home-button register" onClick={() => navigate("/register")}>Register</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
