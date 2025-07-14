import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

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
    <form onSubmit={handleRegister} style={{ paddingTop: "100px", textAlign: "center" }}>
      <h1>Register</h1>
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} /><br />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
