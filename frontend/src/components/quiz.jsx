// src/components/Quiz.jsx
import React, { useState, useEffect } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiLoader,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import "./style.css";
import { getAuth } from "firebase/auth";  
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";



const GENDERS = ["Female", "Male", "Non‑binary", "Prefer not to say"];
const IMAGES = [
  { id: 1, src: "/img/classic.jpg",     label: "Classic" },
  { id: 2, src: "/img/alternative.jpg", label: "Alternative" },
  { id: 3, src: "/img/athleisure.jpg",  label: "Athleisure" },
  { id: 4, src: "/img/bohemian.jpg",    label: "Bohemian" },
  { id: 5, src: "/img/business.jpg",    label: "Business" },
  { id: 6, src: "/img/casual.jpg",      label: "Casual" },
  { id: 7, src: "/img/minimalist.jpg",  label: "Minimalist" },
  { id: 8, src: "/img/streetwear.jpg",  label: "Streetwear" },
  { id: 9, src: "/img/retro.jpg",       label: "Retro" },
];

const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export default function Quiz({ onComplete }) {
const auth = getAuth();  
const navigate = useNavigate();
  const [answers, setAns] = useState({
    username: "",
    avatar: null,
    age: "",
    gender: "",
    bio: "",
    picks: [],
  });

  /* username availability */
  const [checking, setChecking] = useState(false);

  const [available, setAvailable] = useState(null);
  const checkUsername = debounce(async (name) => {
    if (!name) { setAvailable(null); return; }
    setChecking(true);

    try {
      const idToken = auth.currentUser && await auth.currentUser.getIdToken();

      const res = await fetch(
        `http://localhost:5000/check_username?username=${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${idToken}` },  
        }
      );

      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();          
      setAvailable(Boolean(data.available));
    } catch (err) {
      console.error(err);
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  }, 500);

  useEffect(() => checkUsername(answers.username), [answers.username]);

  /* step control */
  const [step, setStep] = useState(0);
  const next = () => {
    if (step < STEPS.length - 1 && STEPS[step].ready()) {
      setStep((s) => s + 1);
    }
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  /* form submit */
   const saveQuiz = async () => {
    const idToken = auth.currentUser && await auth.currentUser.getIdToken();


    const fd = new FormData();
    fd.append("username", answers.username);
    fd.append("avatar",  answers.avatar);
    fd.append("age",     answers.age);
    fd.append("gender",  answers.gender);
    fd.append("bio",     answers.bio);
    fd.append("picks", JSON.stringify(
      answers.picks.map((id) => IMAGES.find((img) => img.id === id)?.label)
    ));


  const res = await fetch("http://localhost:5000/submit_quiz", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },      
      body: fd,
    });

    if (res.ok) {
        console.log("Quiz saved successfully!");
        navigate("/");
    } else {
      alert("Something went wrong saving your quiz.");
    }
  };


  const STEPS = [
    {
      label: "Pick a username",
      render: () => (
        <div className="field-with-status">
          <input
            type="text"
            placeholder="username"
            value={answers.username}
            onChange={(e) =>
              setAns({ ...answers, username: e.target.value.trim() })
            }
          />
          {checking && <FiLoader className="status spinner" />}
          {available === true && !checking && (
            <FiCheckCircle className="status ok" />
          )}
          {available === false && !checking && (
            <FiXCircle className="status error" />
          )}
        </div>
      ),
      ready: () => available,
    },
    {
      label: "Upload an avatar",
      render: () => (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAns({ ...answers, avatar: e.target.files[0] })}
        />
      ),
      ready: () => answers.avatar,
    },
    {
      label: "How old are you?",
      render: () => (
        <input
          type="number"
          min="1"
          max="120"
          value={answers.age}
          onChange={(e) => setAns({ ...answers, age: e.target.value })}
        />
      ),
      ready: () => answers.age,
    },
    {
      label: "What’s your gender?",
      render: () => (
        <select
          value={answers.gender}
          onChange={(e) => setAns({ ...answers, gender: e.target.value })}
        >
          <option value="">Select…</option>
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      ),
      ready: () => answers.gender,
    },
    {
      label: "Write a short bio",
      render: () => (
        <textarea
          placeholder="Tell us something about you…"
          value={answers.bio}
          onChange={(e) => setAns({ ...answers, bio: e.target.value })}
          rows={3}
        />
      ),
      ready: () => answers.bio.trim(),
    },
    {
      label: "Pick your top 3 styles",
      render: () => (
        <div className="quiz-grid">
          {IMAGES.map(({ id, src, label }) => {
            const picked = answers.picks.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={picked ? "quiz-img quiz-img--picked" : "quiz-img"}
                onClick={() =>
                  setAns((prev) => {
                    const picks = prev.picks.includes(id)
                      ? prev.picks.filter((x) => x !== id)
                      : prev.picks.length < 3
                      ? [...prev.picks, id]
                      : prev.picks;
                    return { ...prev, picks };
                  })
                }
              >
                <img src={src} alt={label} />
                <span className="img-tag">{label}</span>
                {picked && (
                  <span className="quiz-picked-badge">
                    {answers.picks.indexOf(id) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ),
      ready: () => answers.picks.length === 3,
    },
    {
      label: "All set! Ready to save?",
      render: () => (
        <button type="button" className="quiz-submit" onClick={saveQuiz}>
          <FiCheck /> Save & Continue
        </button>
      ),
      ready: () => true,
    },
  ];

  const { label, render, ready } = STEPS[step];

  return (
    <div className="wizard-container">
      <h2>{label}</h2>

      <div className="wizard-content">{render()}</div>

      <div className="wizard-nav">
        {step > 0 && (
          <button onClick={back} className="wizard-btn">
            <FiArrowLeft /> Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={next}
            className="wizard-btn"
            disabled={!ready()}
          >
            Next <FiArrowRight />
          </button>
        )}
      </div>

      {/* progress dots */}
      <div className="wizard-dots">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={i === step ? "dot dot--active" : "dot"}
          />
        ))}
      </div>
    </div>
  );
}
