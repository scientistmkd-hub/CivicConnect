import { useState } from "react";
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import MyComplaints from "./MyComplaints";

function App() {
  const navigate = useNavigate();

  const [showReport, setShowReport] = useState(false);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    setShowReport(false);
    setReportMessage("");

    navigate("/login", { replace: true });
  };

  // =========================
  // GET LOCATION
  // =========================

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setReportMessage(
        "Location is not supported by your browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);

        setReportMessage(
          "Location added successfully! 📍"
        );
      },
      () => {
        setReportMessage(
          "Unable to get your location."
        );
      }
    );
  };

  // =========================
  // IMAGE SELECT + CLOUDINARY UPLOAD
  // =========================

  const handleImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      setReportMessage(
        "Please select a valid image file."
      );
      return;
    }

    // Check file size - 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setReportMessage(
        "Image size should be less than 5 MB."
      );
      return;
    }

    try {
      setSelectedFile(file);
      setImageUploading(true);
      setReportMessage("");

      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        "http://localhost:5000/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);

        setReportMessage(
          "Photo uploaded successfully! 📸"
        );
      } else {
        setImageUrl("");
        setSelectedFile(null);

        setReportMessage(
          data.message || "Image upload failed."
        );
      }
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      setImageUrl("");
      setSelectedFile(null);

      setReportMessage(
        "Unable to upload image."
      );
    } finally {
      setImageUploading(false);
    }
  };

  // =========================
  // SUBMIT COMPLAINT
  // =========================

  const handleSubmitReport = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setReportMessage("Please login first.");
      return;
    }

    if (!category) {
      setReportMessage(
        "Please select an issue type."
      );
      return;
    }

    if (!description.trim()) {
      setReportMessage(
        "Please describe the problem."
      );
      return;
    }

    // Wait until image upload is completed
    if (imageUploading) {
      setReportMessage(
        "Please wait until the photo upload is complete."
      );
      return;
    }

    try {
      setReportLoading(true);
      setReportMessage("");

      const response = await fetch(
        "http://localhost:5000/api/complaints",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            category: category,
            description: description,
            imageUrl: imageUrl,
            lat: lat,
            lng: lng,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setReportMessage(
          "Complaint submitted successfully! ✅"
        );

        // Reset form
        setCategory("");
        setDescription("");
        setImageUrl("");
        setSelectedFile(null);
        setLat(null);
        setLng(null);

        setTimeout(() => {
          setShowReport(false);
          setReportMessage("");
        }, 1500);
      } else {
        setReportMessage(
          data.message ||
            "Failed to submit complaint."
        );
      }
    } catch (error) {
      console.error(error);

      setReportMessage(
        "Failed to submit report."
      );
    } finally {
      setReportLoading(false);
    }
  };

  // =========================
  // CLOSE REPORT MODAL
  // =========================

  const handleCloseReport = () => {
    if (reportLoading || imageUploading) {
      return;
    }

    setShowReport(false);
    setReportMessage("");
    setCategory("");
    setDescription("");
    setImageUrl("");
    setSelectedFile(null);
    setLat(null);
    setLng(null);
  };

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="logo">
          Civic Connect
        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#report">
            Report Issue
          </a>

          <a href="#about">
            About
          </a>

          <button
  className="login-btn"
  onClick={() => navigate("/my-complaints")}
>
  My Complaints
</button>

<button
  className="login-btn"
  onClick={handleLogout}
>
  Logout
</button>

        </div>

      </nav>


      {/* =========================
          HERO
      ========================= */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-text">

          <p className="small-title">
            LOCAL CIVIC ISSUE REPORTING
          </p>

          <h1>
            Report. Track.
            <br />
            <span>Resolve.</span>
          </h1>

          <p className="description">
            Found a road problem, garbage issue,
            broken streetlight or other civic
            problem? Report it easily with a photo
            and location.
          </p>

          <button
            className="report-btn"
            onClick={() =>
              setShowReport(true)
            }
          >
            + Report an Issue
          </button>

        </div>


        <div className="hero-card">

          <div className="card-icon">
            📍
          </div>

          <h3>
            Report problems around you
          </h3>

          <p>
            Add a photo, describe the problem
            and share your location.
          </p>

          <div className="mini-status">
            ● Easy to report
          </div>

        </div>

      </section>


      {/* =========================
          COMMON ISSUES
      ========================= */}

      <section
        className="issues"
        id="report"
      >

        <h2>
          Common Issues
        </h2>

        <p className="section-text">
          Some common problems you can report.
        </p>

        <div className="issue-grid">

          <div className="issue-card">

            <div className="issue-icon">
              🛣️
            </div>

            <h3>
              Road Damage
            </h3>

            <p>
              Potholes and damaged roads
            </p>

          </div>


          <div className="issue-card">

            <div className="issue-icon">
              🗑️
            </div>

            <h3>
              Garbage
            </h3>

            <p>
              Uncollected waste and garbage
            </p>

          </div>


          <div className="issue-card">

            <div className="issue-icon">
              💡
            </div>

            <h3>
              Street Light
            </h3>

            <p>
              Broken or non-working lights
            </p>

          </div>


          <div className="issue-card">

            <div className="issue-icon">
              💧
            </div>

            <h3>
              Water Problem
            </h3>

            <p>
              Water leakage or supply issues
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section
        className="how-section"
        id="about"
      >

        <h2>
          How it works
        </h2>

        <div className="steps">

          <div className="step">

            <div className="step-number">
              1
            </div>

            <h3>
              Report
            </h3>

            <p>
              Submit the problem with photo
              and location.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              2
            </div>

            <h3>
              Track
            </h3>

            <p>
              Check the status of your complaint.
            </p>

          </div>


          <div className="step">

            <div className="step-number">
              3
            </div>

            <h3>
              Resolve
            </h3>

            <p>
              The concerned department works on it.
            </p>

          </div>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================= */}

      <footer>

        <h3>
          Civic Connect
        </h3>

        <p>
          Simple way to report local civic issues.
        </p>

        <p className="copyright">
          © 2026 Civic Connect
        </p>

      </footer>


      {/* =========================
          REPORT MODAL
      ========================= */}

      {showReport && (

        <div className="modal-bg">

          <div className="report-card">

            <button
              className="close-btn"
              onClick={handleCloseReport}
              disabled={
                reportLoading ||
                imageUploading
              }
            >
              ×
            </button>


            <h2>
              Report an Issue
            </h2>

            <p>
              Tell us about the problem in
              your area.
            </p>


            {/* ISSUE TYPE */}

            <label>
              Issue Type
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >

              <option value="">
                Select an issue
              </option>

              <option value="Road Damage">
                Road Damage
              </option>

              <option value="Garbage">
                Garbage
              </option>

              <option value="Street Light">
                Street Light
              </option>

              <option value="Water Problem">
                Water Problem
              </option>

              <option value="Other">
                Other
              </option>

            </select>


            {/* DESCRIPTION */}

            <label>
              Description
            </label>

            <textarea
              placeholder="Describe the problem..."
              rows="4"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />


            {/* IMAGE */}

            <label>
              Upload Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={
                imageUploading ||
                reportLoading
              }
            />


            {imageUploading && (
              <p className="login-note">
                Uploading photo... ⏳
              </p>
            )}


            {selectedFile &&
              !imageUploading && (
                <p className="login-note">
                  {selectedFile.name}
                </p>
              )}


            {/* CLOUDINARY IMAGE PREVIEW */}

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Selected issue"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  marginTop: "10px",
                  borderRadius: "10px",
                }}
              />
            )}


            {/* LOCATION */}

            <button
              className="otp-btn"
              onClick={handleGetLocation}
              disabled={
                reportLoading ||
                imageUploading
              }
            >
              📍 Use Current Location
            </button>


            {/* SUBMIT */}

            <button
              className="submit-report-btn"
              onClick={handleSubmitReport}
              disabled={
                reportLoading ||
                imageUploading
              }
            >
              {reportLoading
                ? "Submitting..."
                : imageUploading
                ? "Uploading Photo..."
                : "Submit Report"}
            </button>


            {reportMessage && (
              <p className="login-note">
                {reportMessage}
              </p>
            )}

          </div>

        </div>

      )}

    </div>
  );
}


// =====================================================
// PROTECTED HOME ROUTE
// =====================================================

function HomeRoute() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <App />;
}


// =====================================================
// LOGIN ROUTE
// =====================================================

function LoginRoute() {
  const userId = localStorage.getItem("userId");

  if (userId) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Login />;
}


function AppRouter() {
  return (
    <BrowserRouter>

      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={<HomeRoute />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<LoginRoute />}
        />

        {/* MY COMPLAINTS */}
        <Route
          path="/my-complaints"
          element={<MyComplaints />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRouter;