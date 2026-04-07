import { useEffect, useState } from "react";
import { ClipboardList, UserRound } from "lucide-react";
import axiosInstance from "../../api/axios";
import PageWrapper from "../../components/PageWrapper";
import GlassCard from "../../components/GlassCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";

function ManageRequests() {
  const [sports, setSports] = useState([]);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [requests, setRequests] = useState([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const fetchSports = async () => {
    try {
      const response = await axiosInstance.get("/sports");
      setSports(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  };

  const fetchRequests = async (sportId) => {
    if (!sportId) { setRequests([]); return; }
    setLoadingRequests(true);
    try {
      const response = await axiosInstance.get(`/requests/sport/${sportId}`);
      setRequests(response.data);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to load requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => { fetchSports(); }, []);
  useEffect(() => { if (selectedSportId) fetchRequests(selectedSportId); }, [selectedSportId]);

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.put(`/requests/${requestId}/approve`);
      alert("Request approved successfully");
      fetchRequests(selectedSportId);
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
      fetchRequests(selectedSportId);
    } catch (error) {
      alert(error.response?.data?.message || "Reject failed");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <PageWrapper
      title="Manage Requests"
      subtitle="Review incoming student requests for each sport and make approval decisions."
    >
      <GlassCard className="mb-6">
        {loadingSports ? (
          <LoadingSpinner text="Loading sports..." />
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Select Sport</label>
            <select
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">-- Select a sport --</option>
              {sports.map((sport) => (
                <option key={sport._id} value={sport._id}>{sport.name}</option>
              ))}
            </select>
          </div>
        )}
      </GlassCard>

      {!selectedSportId && <GlassCard><p className="text-slate-300">Please select a sport first.</p></GlassCard>}
      {selectedSportId && loadingRequests && <LoadingSpinner text="Loading requests..." />}

      {selectedSportId && !loadingRequests && (
        requests.length === 0 ? (
          <GlassCard><p className="text-slate-300">No requests found for this sport.</p></GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {requests.map((request) => (
              <GlassCard key={request._id}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><UserRound size={20} /></div>
                  <StatusBadge status={request.status} />
                </div>
                <h3 className="text-xl font-bold text-white">{request.name}</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>Email: {request.email}</p>
                  <p>NIC: {request.nic}</p>
                  <p>Registration No: {request.registrationNumber}</p>
                  <p>Phone: {request.phone}</p>
                  <p>Height: {request.height}</p>
                  <p>Weight: {request.weight}</p>
                  <p>Extra Skills: {request.extraSkills || "Not specified"}</p>
                </div>
                {request.status === "PENDING" && (
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                      className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
                    >
                      {processingId === request._id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                      className="flex-1 rounded-2xl bg-rose-400/15 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-400/25 disabled:opacity-70"
                    >
                      {processingId === request._id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )
      )}
    </PageWrapper>
  );
}

export default ManageRequests;
