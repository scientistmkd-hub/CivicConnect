import { useEffect, useState } from "react";
import "./Admin.css";

function Admin() {
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingComplaints, setLoadingComplaints] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [updatingComplaintId, setUpdatingComplaintId] =
    useState(null);

  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  const [message, setMessage] = useState("");

  const [expandedComplaintId, setExpandedComplaintId] =
    useState(null);

  useEffect(() => {
    fetchComplaints();
    fetchUsers();
  }, []);

  // =========================
  // FETCH COMPLAINTS
  // =========================

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);

      const response = await fetch(
        "http://localhost:5000/api/complaints"
      );

      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints || []);
      } else {
        setMessage(
          data.message || "Failed to load complaints."
        );
      }
    } catch (error) {
      console.error(
        "Fetch complaints error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    } finally {
      setLoadingComplaints(false);
    }
  };

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await fetch(
        "http://localhost:5000/api/users"
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        setMessage(
          data.message || "Failed to load users."
        );
      }
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      setMessage(
        "Unable to fetch users."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // =========================
  // REFRESH EVERYTHING
  // =========================

  const refreshDashboard = () => {
    setMessage("");
    fetchComplaints();
    fetchUsers();
  };

  // =========================
  // UPDATE COMPLAINT STATUS
  // =========================

  const updateStatus = async (
    complaintId,
    newStatus
  ) => {
    try {
      setUpdatingComplaintId(complaintId);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/complaints/${complaintId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setComplaints((previousComplaints) =>
          previousComplaints.map(
            (complaint) =>
              complaint._id === complaintId
                ? {
                    ...complaint,
                    status: newStatus,
                  }
                : complaint
          )
        );

        setMessage(
          "Complaint status updated successfully! ✅"
        );

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(
          data.message ||
            "Failed to update status."
        );
      }
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setMessage(
        "Unable to update complaint status."
      );
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  // =========================
  // BLOCK / UNBLOCK USER
  // =========================

  const toggleBlockUser = async (userId) => {
    try {
      setUpdatingUserId(userId);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/block`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user._id === userId
              ? {
                  ...user,
                  isBlocked:
                    data.user.isBlocked,
                }
              : user
          )
        );

        setMessage(data.message);

        setTimeout(() => {
          setMessage("");
        }, 2000);
      } else {
        setMessage(
          data.message ||
            "Failed to update user."
        );
      }
    } catch (error) {
      console.error(
        "Block user error:",
        error
      );

      setMessage(
        "Unable to update user."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // =========================
  // PRIORITY CLASS
  // =========================

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "priority-critical";

      case "High":
        return "priority-high";

      case "Medium":
        return "priority-medium";

      case "Low":
        return "priority-low";

      default:
        return "priority-medium";
    }
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    switch (status) {
      case "Resolved":
        return "status-resolved";

      case "In Progress":
        return "status-progress";

      default:
        return "status-pending";
    }
  };

  return (
    <div className="admin-page">

      {/* ================= NAVBAR ================= */}

      <nav className="admin-navbar">

        <div className="admin-logo">
          Civic Connect
        </div>

        <div className="admin-title">
          Admin Dashboard
        </div>

      </nav>

      {/* ================= MAIN ================= */}

      <main className="admin-container">

        {/* ================= HEADER ================= */}

        <div className="dashboard-header">

          <div>
            <h1>
              Admin Dashboard
            </h1>

            <p>
              Manage civic complaints and
              registered users.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={refreshDashboard}
          >
            🔄 Refresh
          </button>

        </div>

        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        {/* ================= STATS ================= */}

        <div className="admin-stats">

          <div className="stat-card">
            <span className="stat-icon">
              📋
            </span>

            <div>
              <p>Total Complaints</p>

              <h2>
                {complaints.length}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              ⏳
            </span>

            <div>
              <p>Pending</p>

              <h2>
                {
                  complaints.filter(
                    (complaint) =>
                      complaint.status ===
                      "Pending"
                  ).length
                }
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              🔄
            </span>

            <div>
              <p>In Progress</p>

              <h2>
                {
                  complaints.filter(
                    (complaint) =>
                      complaint.status ===
                      "In Progress"
                  ).length
                }
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              ✅
            </span>

            <div>
              <p>Resolved</p>

              <h2>
                {
                  complaints.filter(
                    (complaint) =>
                      complaint.status ===
                      "Resolved"
                  ).length
                }
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">
              👥
            </span>

            <div>
              <p>Total Users</p>

              <h2>
                {users.length}
              </h2>
            </div>
          </div>

        </div>

        {/* ================= COMPLAINTS ================= */}

        <section className="admin-section">

          <div className="section-heading">

            <div>
              <h2>
                Reported Issues
              </h2>

              <p>
                Review and update submitted
                civic complaints.
              </p>
            </div>

          </div>

          {loadingComplaints ? (

            <div className="empty-box">

              <div className="empty-icon">
                ⏳
              </div>

              <h3>
                Loading complaints...
              </h3>

            </div>

          ) : complaints.length === 0 ? (

            <div className="empty-box">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No complaints yet
              </h3>

              <p>
                User complaints will appear
                here.
              </p>

            </div>

          ) : (

            <div className="complaints-grid">

              {complaints.map((complaint) => {

                const isExpanded =
                  expandedComplaintId ===
                  complaint._id;

                return (
                  <div
                    className={`complaint-card ${
                      isExpanded
                        ? "complaint-card-expanded"
                        : ""
                    }`}
                    key={complaint._id}
                  >

                    {/* ================= COMPACT SUMMARY ================= */}

                    <button
                      type="button"
                      className="complaint-summary"
                      onClick={() =>
                        setExpandedComplaintId(
                          isExpanded
                            ? null
                            : complaint._id
                        )
                      }
                    >

                      <div className="complaint-summary-main">

                        <div className="complaint-summary-title">

                          <h3>
                            {complaint.category}
                          </h3>

                          <span className="complaint-id">
                            ID:{" "}
                            {complaint._id.slice(-6)}
                          </span>

                        </div>

                        <p className="complaint-summary-description">
                          {complaint.description}
                        </p>

                        <div className="complaint-summary-meta">

                          <span>
                            Reported by:{" "}
                            {complaint.userId?.email ||
                              "Unknown user"}
                          </span>

                          <span>
                            {complaint.createdAt
                              ? new Date(
                                  complaint.createdAt
                                ).toLocaleString()
                              : "Unknown date"}
                          </span>

                        </div>

                      </div>

                      <div className="complaint-summary-side">

                        <span
                          className={`priority-badge ${getPriorityClass(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority ||
                            "Medium"}
                        </span>

                        <span
                          className={`status-badge ${getStatusClass(
                            complaint.status
                          )}`}
                        >
                          {complaint.status ||
                            "Pending"}
                        </span>

                        <span className="details-toggle">
                          {isExpanded
                            ? "▲ Hide Details"
                            : "▼ View Details"}
                        </span>

                      </div>

                    </button>

                    {/* ================= FULL DETAILS ================= */}

                    {isExpanded && (
                      <div className="complaint-details">

                        {/* IMAGE */}

                        {complaint.imageUrl && (
                          <img
                            src={complaint.imageUrl}
                            alt="Reported issue"
                            className="complaint-image"
                          />
                        )}

                        {/* DESCRIPTION */}

                        <div className="complaint-section">

                          <h4>
                            Description
                          </h4>

                          <p>
                            {complaint.description}
                          </p>

                        </div>

                        {/* AI ANALYSIS */}

                        {complaint.aiAnalysis && (
                          <div className="ai-analysis-box">

                            <div className="ai-analysis-title">
                              🤖 Multi-AI Analysis
                            </div>

                            {(() => {

                              try {

                                const analysis =
                                  JSON.parse(
                                    complaint.aiAnalysis
                                  );

                                const providers = [
                                  {
                                    key: "gemini",
                                    name: "Gemini",
                                  },
                                  {
                                    key: "openai",
                                    name: "OpenAI",
                                  },
                                  {
                                    key: "zai",
                                    name: "Z AI",
                                  },
                                  {
                                    key: "openrouter",
                                    name: "OpenRouter",
                                  },
                                  {
                                    key: "claude",
                                    name: "Claude",
                                  },
                                ];

                                return (
                                  <div className="multi-ai-results">

                                    {providers.map(
                                      (provider) => {

                                        const result =
                                          analysis[
                                            provider.key
                                          ];

                                        return (
                                          <div
                                            className="ai-provider-card"
                                            key={
                                              provider.key
                                            }
                                          >

                                            <h4>
                                              {
                                                provider.name
                                              }
                                            </h4>

                                            {result?.error ? (

                                              <p className="ai-provider-error">
                                                ⚠️{" "}
                                                {
                                                  result.error
                                                }
                                              </p>

                                            ) : result?.raw ? (

                                              <p className="ai-provider-error">
                                                Could not parse AI response.
                                              </p>

                                            ) : result ? (

                                              <>
                                                <p>
                                                  <strong>
                                                    Category:
                                                  </strong>{" "}
                                                  {
                                                    result.category ||
                                                    "N/A"
                                                  }
                                                </p>

                                                <p>
                                                  <strong>
                                                    Priority:
                                                  </strong>{" "}
                                                  {
                                                    result.priority ||
                                                    "N/A"
                                                  }
                                                </p>

                                                <p>
                                                  <strong>
                                                    Summary:
                                                  </strong>{" "}
                                                  {
                                                    result.summary ||
                                                    "N/A"
                                                  }
                                                </p>

                                                <p>
                                                  <strong>
                                                    Duplicate Possible:
                                                  </strong>{" "}
                                                  {
                                                    result.duplicatePossible
                                                      ? "Yes"
                                                      : "No"
                                                  }
                                                </p>

                                                <p>
                                                  <strong>
                                                    Reason:
                                                  </strong>{" "}
                                                  {
                                                    result.reason ||
                                                    "N/A"
                                                  }
                                                </p>
                                              </>

                                            ) : (

                                              <p>
                                                No analysis available.
                                              </p>

                                            )}

                                          </div>
                                        );
                                      }
                                    )}

                                  </div>
                                );

                              } catch (error) {

                                return (
                                  <p className="ai-error">
                                    AI analysis unavailable.
                                  </p>
                                );

                              }

                            })()}

                          </div>
                        )}

                        {/* USER */}

                        <div className="complaint-section">

                          <h4>
                            Reported By
                          </h4>

                          <p>
                            {complaint.userId?.email ||
                              "Unknown user"}
                          </p>

                        </div>

                        {/* LOCATION */}

                        <div className="complaint-section">

                          <h4>
                            Location
                          </h4>

                          {complaint.location?.lat !=
                            null &&
                          complaint.location?.lng !=
                            null ? (

                            <>
                              <p>
                                📍{" "}
                                {
                                  complaint.location.lat
                                }
                                ,{" "}
                                {
                                  complaint.location.lng
                                }
                              </p>

                              <a
                                href={`https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="map-link"
                              >
                                View on Google Maps
                              </a>
                            </>

                          ) : (

                            <p>
                              No location provided
                            </p>

                          )}

                        </div>

                        {/* DATE */}

                        <div className="complaint-section">

                          <h4>
                            Reported On
                          </h4>

                          <p>
                            {complaint.createdAt
                              ? new Date(
                                  complaint.createdAt
                                ).toLocaleString()
                              : "Unknown"}
                          </p>

                        </div>

                        {/* STATUS */}

                        <div className="complaint-footer">

                          <select
                            className={`status-select ${getStatusClass(
                              complaint.status
                            )}`}
                            value={
                              complaint.status ||
                              "Pending"
                            }
                            disabled={
                              updatingComplaintId ===
                              complaint._id
                            }
                            onChange={(e) =>
                              updateStatus(
                                complaint._id,
                                e.target.value
                              )
                            }
                          >

                            <option value="Pending">
                              Pending
                            </option>

                            <option value="In Progress">
                              In Progress
                            </option>

                            <option value="Resolved">
                              Resolved
                            </option>

                          </select>

                          {updatingComplaintId ===
                            complaint._id && (
                            <span className="updating-text">
                              Updating...
                            </span>
                          )}

                        </div>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          )}

        </section>

        {/* ================= USERS ================= */}

        <section className="admin-section users-section">

          <div className="section-heading">

            <div>
              <h2>
                Registered Users
              </h2>

              <p>
                Manage users and prevent misuse
                of the reporting system.
              </p>
            </div>

          </div>

          {loadingUsers ? (

            <div className="empty-box">

              <div className="empty-icon">
                ⏳
              </div>

              <h3>
                Loading users...
              </h3>

            </div>

          ) : users.length === 0 ? (

            <div className="empty-box">

              <div className="empty-icon">
                👥
              </div>

              <h3>
                No users found
              </h3>

              <p>
                Registered users will appear
                here.
              </p>

            </div>

          ) : (

            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>

                    <th>
                      Email
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {users.map(
                    (user) => (

                      <tr
                        key={user._id}
                      >

                        <td>

                          <div className="user-email">
                            📧{" "}
                            {user.email}
                          </div>

                        </td>

                        <td>

                          <span className="role-badge">
                            {user.role}
                          </span>

                        </td>

                        <td>

                          {user.isBlocked ? (

                            <span className="blocked-badge">
                              Blocked
                            </span>

                          ) : (

                            <span className="active-badge">
                              Active
                            </span>

                          )}

                        </td>

                        <td>

                          <button
                            className={
                              user.isBlocked
                                ? "unblock-btn"
                                : "block-btn"
                            }
                            disabled={
                              updatingUserId ===
                              user._id
                            }
                            onClick={() =>
                              toggleBlockUser(
                                user._id
                              )
                            }
                          >

                            {updatingUserId ===
                            user._id
                              ? "Updating..."
                              : user.isBlocked
                              ? "Unblock"
                              : "Block User"}

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Admin;