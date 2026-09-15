import { useEffect, useState } from "react";
import "./MyComplaints.css";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(
          `https://civicconnect-backend.vercel.app/api/complaints/user/${userId}`
        );

        const data = await response.json();

        if (data.success) {
          setComplaints(data.complaints);
        }
      } catch (error) {
        console.error("Fetch complaints error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchComplaints();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const getStatusClass = (status) => {
    if (status === "Resolved") return "resolved";
    if (status === "In Progress") return "progress";
    return "pending";
  };

  if (loading) {
    return (
      <div className="my-complaints-page">
        <div className="complaints-container">
          <p className="loading-text">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-complaints-page">
      <div className="complaints-container">

        <div className="complaints-header">
          <h1>My Complaints</h1>
          <p>Track the complaints you have reported.</p>
        </div>

        {complaints.length === 0 ? (
          <div className="empty-complaints">
            <h3>No complaints yet</h3>
            <p>
              You haven't reported any civic issues yet.
            </p>
          </div>
        ) : (
          <div className="complaints-list">

            {complaints.map((complaint) => (
              <div
                className="complaint-card"
                key={complaint._id}
              >

                <div className="complaint-top">

                  <div>
                    <h3>{complaint.category}</h3>

                    <p className="complaint-date">
                      {new Date(
                        complaint.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      complaint.status
                    )}`}
                  >
                    {complaint.status}
                  </span>

                </div>

                <p className="complaint-description">
                  {complaint.description}
                </p>

                <div className="complaint-info">

                  <div>
                    <strong>Priority</strong>
                    <span>{complaint.priority}</span>
                  </div>

                  <div>
                    <strong>Complaint ID</strong>
                    <span>
                      {complaint._id.slice(-6)}
                    </span>
                  </div>

                </div>

                {complaint.imageUrl && (
                  <img
                    src={complaint.imageUrl}
                    alt="Complaint"
                    className="complaint-image"
                  />
                )}

                {complaint.location?.lat &&
                  complaint.location?.lng && (
                    <a
                      className="location-link"
                      href={`https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📍 View Reported Location
                    </a>
                  )}

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default MyComplaints;
