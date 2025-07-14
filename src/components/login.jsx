import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ paddingTop: "100px", textAlign: "center" }}>
      <h1>Login</h1>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} /><br />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
