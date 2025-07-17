import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";   
import "./style.css";
const API_ROOT = "http://localhost:5000";

const authedFetch = async (url, options = {}) => {
  const idToken = await auth.currentUser.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  });
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();                

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const profile = await authedFetch(`${API_ROOT}/fetch_profile`).then(r => r.json());

    if (!profile.displayName) {
  navigate("/quiz", { replace:true });    
} else {
  navigate("/", { replace:true });        
}

    } catch (err) {
      alert(err.message);                        
    }
  };
  
  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleLogin}>
        <h1 className="form-title">Login</h1>
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
          Log In
        </button>
      </form>
    </div>
  );
};

export default Login;
