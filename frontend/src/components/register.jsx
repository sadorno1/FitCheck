import { useState } from "react"; // You need this
import { auth } from "../firebase/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // ✅ NEW

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Set the user's display name (username)
      await updateProfile(user, {
        displayName: username,
      });

      alert("Registered!");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="form-container">
      <form className="form-card" onSubmit={handleRegister}>
        <h1 className="form-title">Register</h1>

        {/* ✅ Username input */}
        <input
          className="form-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="form-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          value={password}
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
