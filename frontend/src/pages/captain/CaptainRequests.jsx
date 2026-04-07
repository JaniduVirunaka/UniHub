import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageWrapper from "../../components/PageWrapper";
import GlassCard from "../../components/GlassCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";

function CaptainRequests() {
  const { user } = useAuth();
  const [sport, setSport] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchMySportAndRequests = async () => {
    try {
      const sportsResponse = await axiosInstance.get("/sports");
      const mySport = sportsResponse.data.find(
        (item) => item.captain && item.captain._id === user.id
      );

      if (!mySport) { setSport(null); setRequests([]); return; }

      setSport(mySport);
      const requestsResponse = await axiosInstance.get(`/requests/sport/${mySport._id}`);
      setRequests(requestsResponse.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load captain requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchMySportAndRequests(); }, [user]);

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

  if (loading) return <PageWrapper title="Captain Requests"><LoadingSpinner text="Loading requests..." /></PageWrapper>;

  if (!sport) return (
    <PageWrapper title="Captain Requests" subtitle="No sport assigned to this captain yet.">
      <GlassCard><p className="text-slate-300">No sport assigned to you as captain.</p></GlassCard>
    </PageWrapper>
  );

  return (
    <PageWrapper title="Captain Requests" subtitle={`Managing requests for: ${sport.name}`}>
      {requests.length === 0 ? (
        <GlassCard><p className="text-slate-300">No requests found for this sport.</p></GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <GlassCard key={request._id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{request.name}</h3>
                <StatusBadge status={request.status} />
              </div>
              <div className="space-y-1 text-sm text-slate-300">
                <p>Email: {request.email}</p>
                <p>NIC: {request.nic}</p>
                <p>Registration No: {request.registrationNumber}</p>
                <p>Phone: {request.phone}</p>
                <p>Height: {request.height} | Weight: {request.weight}</p>
                <p>Extra Skills: {request.extraSkills || "Not specified"}</p>
              </div>
              {request.status === "PENDING" && (
                <div className="mt-5 flex gap-3">
                  <button onClick={() => handleApprove(request._id)} disabled={processingId === request._id} className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70">
                    {processingId === request._id ? "Processing..." : "Approve"}
                  </button>
                  <button onClick={() => handleReject(request._id)} disabled={processingId === request._id} className="flex-1 rounded-2xl bg-rose-400/15 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-400/25 disabled:opacity-70">
                    {processingId === request._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default CaptainRequests;
