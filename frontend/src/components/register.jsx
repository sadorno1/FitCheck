import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "./style.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Registered!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleRegister}>
        <h1 className="form-title">Register</h1>
        <input
          className="form-input"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="form-button" type="submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
