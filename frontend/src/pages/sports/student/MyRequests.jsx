import { useEffect, useState } from "react";
import { FileClock, Trophy } from "lucide-react";
import axiosInstance from "../../../api/axios";
import PageWrapper from "../../../components/PageWrapper";
import LoadingSpinner from "../../../components/LoadingSpinner";
import GlassCard from "../../../components/GlassCard";
import StatusBadge from "../../../components/StatusBadge";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRequests = async () => {
    try {
      const response = await axiosInstance.get("/requests/my");
      setRequests(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyRequests(); }, []);

  if (loading) {
    return (
      <PageWrapper title="My Requests" subtitle="Track the progress of all your submitted sport join requests.">
        <LoadingSpinner text="Loading your requests..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Requests" subtitle="Monitor the status of your join requests and stay updated on approvals.">
      {requests.length === 0 ? (
        <GlassCard>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <FileClock size={20} className="text-cyan-600 dark:text-cyan-300" />
            <p>No requests found.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <GlassCard key={request._id} className="relative transition hover:-translate-y-1 hover:z-10 hover:bg-white/10">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-600 dark:text-emerald-300">
                  <Trophy size={20} />
                </div>
                <StatusBadge status={request.status} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{request.sport?.name || "Sport not found"}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Registration No:</span> {request.registrationNumber}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Extra Skills:</span> {request.extraSkills || "Not specified"}</p>
                <p><span className="font-semibold text-slate-700 dark:text-slate-200">Submitted:</span> {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default MyRequests;
