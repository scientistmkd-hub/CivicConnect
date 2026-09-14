import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setMessage("Please enter your Gmail address.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setMessage("OTP sent to your Gmail! 📧");
      } else {
        setMessage(data.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      return;
    }

    try {
      setVerifyLoading(true);
      setMessage("");

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        setMessage("Login successful! 🎉");

        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        setMessage(data.message || "Invalid OTP.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server.");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="login-icon">✉️</div>

        <h1>Login to Civic Connect</h1>

        <p className="login-description">
          Enter your Gmail address to receive an OTP.
        </p>

        <div className="login-form">

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your Gmail address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="login-btn"
            onClick={handleSendOtp}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {otpSent && (
            <>
              <label>Enter OTP</label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
              />

              <button
                className="verify-btn"
                onClick={handleVerifyOtp}
                disabled={verifyLoading}
              >
                {verifyLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                className="resend-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </>
          )}

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}

        </div>

        <p className="login-note">
          We will send a one-time password to your email.
        </p>

      </div>
    </div>
  );
}

export default Login;