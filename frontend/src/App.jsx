import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Apne backend ka deployed ya local URL yahan likhein
const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` });

export default function App() {
  const [status, setStatus] = useState({ totalSeats: 30, confirmed: 0, held: 0, available: 30 });
  const [email, setEmail] = useState("");
  const [holdData, setHoldData] = useState(null); // { holdId, expiresAt }
  const [timeLeft, setTimeLeft] = useState(0); // Seconds me countdown
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);

  // 1. Live seat counter poll loop (Har 3 seconds baad)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.get(`/status`);
        setStatus(res.data);
      } catch (err) {
        console.error("Status check failed", err);
      }
    };

    fetchStatus(); // First load execution
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Countdown Timer Logic (2-minute engine tracker)
  useEffect(() => {
    if (!holdData) return;

    const calculateTimeLeft = () => {
      const difference = new Date(holdData.expiresAt) - new Date();
      if (difference <= 0) {
        setTimeLeft(0);
        setHoldData(null);
        setError("Your 2-minute seat hold has expired!");
        setMessage("");
        clearInterval(timerRef.current);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    };

    calculateTimeLeft();
    timerRef.current = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timerRef.current);
  }, [holdData]);

  // 3. POST /api/reserve Trigger handler
  const handleReserve = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post(`/reserve`, { email });
      setHoldData(res.data); // holds { holdId, expiresAt }
      setMessage("Seat held successfully! Confirm your seat within 2 minutes.");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "Reservation failed.");
    } finally {
      setLoading(false);
    }
  };

  // 4. POST /api/confirm Trigger handler
  const handleConfirm = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post(`/confirm`, { holdId: holdData.holdId });
      setMessage(res.data.message || "Seat confirmed successfully!");
      setHoldData(null); // Clear hold form elements state
      setTimeLeft(0);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Seconds format converter helper (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", fontFamily: "sans-serif", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Concert X Ticket Flash Sale</h2>

      {/* Dynamic Status Counter Component Display metrics */}
      <div style={{ display: "flex", justifyContent: "space-between", background: "#f0f0f0", padding: "10px", borderRadius: "5px", marginBottom: "20px" }}>
        <div><strong>Available:</strong> {status.available}</div>
        <div><strong>Held:</strong> {status.held}</div>
        <div><strong>Confirmed:</strong> {status.confirmed}</div>
      </div>

      {/* Alert states notification wrappers */}
      {error && <div style={{ color: "red", background: "#fee2e2", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>{error}</div>}
      {message && <div style={{ color: "green", background: "#dcfce7", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>{message}</div>}

      {/* Reservation Form Input element conditional controls wrapper */}
      {!holdData ? (
        <form onSubmit={handleReserve}>
          <div style={{ marginBottom: "10px" }}>
            <label>Email Address:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px", boxSizing: "border-box" }}
              placeholder="user@example.com"
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            {loading ? "Processing..." : "Reserve Seat"}
          </button>
        </form>
      ) : (
        /* Confirmation Mode State Control Window */
        <div style={{ background: "#eff6ff", padding: "15px", borderRadius: "5px", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>Seat Held Securely</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 0" }}>Time Left: {formatTime(timeLeft)}</p>
          <button onClick={handleConfirm} disabled={loading} style={{ width: "100%", padding: "10px", background: "#22c55e", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
            {loading ? "Processing..." : "Confirm Booking Now"}
          </button>
        </div>
      )}
    </div>
  );
};