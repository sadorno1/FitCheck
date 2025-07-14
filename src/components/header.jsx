import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        paddingTop: "100px",
        textAlign: "center",
        fontFamily: "Avenir, Helvetica, sans-serif",
        color: "#333",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>👕 FitCheck</h1>
      <p style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 30px" }}>
        FitCheck helps you keep track of your outfits, explore new styles, and get inspired—where fashion meets functionality.
        <br />
        <br />
        To get started, log in or create your profile to build your virtual closet.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <button
          onClick={() => navigate("/login")}
          style={btnStyle}
        >
          Log In
        </button>
        <button
          onClick={() => navigate("/register")}
          style={btnStyle}
        >
          Register
        </button>
      </div>
    </div>
  );
};

const btnStyle = {
  padding: "12px 24px",
  fontSize: "1rem",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#8e44ad",
  color: "#fff",
  cursor: "pointer",
  transition: "background-color 0.3s",
};

export default Home;
