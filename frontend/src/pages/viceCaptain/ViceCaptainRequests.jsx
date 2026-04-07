import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function ViceCaptainRequests() {
  const { user } = useAuth();
  const [sport, setSport] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchMySportAndRequests = async () => {
    try {
      const sportsResponse = await axiosInstance.get("/sports");
      const sports = sportsResponse.data;

      const mySport = sports.find(
        (item) => item.viceCaptain && item.viceCaptain._id === user.id
      );

      if (!mySport) {
        setSport(null);
        setRequests([]);
        return;
      }

      setSport(mySport);

      const requestsResponse = await axiosInstance.get(
        `/requests/sport/${mySport._id}`
      );

      setRequests(requestsResponse.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load vice captain requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMySportAndRequests();
    }
  }, [user]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.put(`/requests/${requestId}/approve`);
      alert("Request approved successfully");
      fetchMySportAndRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Approve failed");
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.put(`/requests/${requestId}/reject`);
      alert("Request rejected successfully");
      fetchMySportAndRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Reject failed");
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return <p>Loading vice captain requests...</p>;
  }

  if (!sport) {
    return <p>No sport assigned to this vice captain.</p>;
  }

  return (
    <div>
      <h1>Vice Captain Request Management</h1>
      <p><strong>Sport:</strong> {sport.name}</p>

      {requests.length === 0 ? (
        <p>No requests found for this sport.</p>
      ) : (
        requests.map((request) => (
          <div
            key={request._id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "12px",
              borderRadius: "8px"
            }}
          >
            <h3>{request.name}</h3>
            <p>Email: {request.email}</p>
            <p>NIC: {request.nic}</p>
            <p>Registration Number: {request.registrationNumber}</p>
            <p>Phone: {request.phone}</p>
            <p>Height: {request.height}</p>
            <p>Weight: {request.weight}</p>
            <p>Extra Skills: {request.extraSkills}</p>
            <p>Status: {request.status}</p>

            {request.status === "PENDING" && (
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => handleApprove(request._id)}
                  disabled={processingId === request._id}
                  style={{ marginRight: "10px" }}
                >
                  {processingId === request._id ? "Processing..." : "Approve"}
                </button>

                <button
                  onClick={() => handleReject(request._id)}
                  disabled={processingId === request._id}
                >
                  {processingId === request._id ? "Processing..." : "Reject"}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ViceCaptainRequests;