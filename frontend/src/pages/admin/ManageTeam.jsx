import { useEffect, useState } from "react";
import { Crown, Medal, UserMinus, Users } from "lucide-react";
import axiosInstance from "../../api/axios";
import PageWrapper from "../../components/PageWrapper";
import GlassCard from "../../components/GlassCard";
import LoadingSpinner from "../../components/LoadingSpinner";

function ManageTeam() {
  const [sports, setSports] = useState([]);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [sportDetails, setSportDetails] = useState(null);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchSports = async () => {
    try {
      const response = await axiosInstance.get("/sports");
      setSports(response.data);
    } catch (error) {
      alert("Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  };

  const fetchSportDetails = async (sportId) => {
    if (!sportId) { setSportDetails(null); return; }
    setLoadingDetails(true);
    try {
      const response = await axiosInstance.get(`/sports/${sportId}`);
      setSportDetails(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load sport details");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => { fetchSports(); }, []);
  useEffect(() => { if (selectedSportId) fetchSportDetails(selectedSportId); }, [selectedSportId]);

  const assignCaptain = async (studentId) => {
    setProcessing(true);
    try {
      await axiosInstance.put(`/sports/${selectedSportId}/assign-captain`, { studentId });
      alert("Captain assigned successfully");
      fetchSportDetails(selectedSportId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to assign captain");
    } finally {
      setProcessing(false);
    }
  };

  const assignViceCaptain = async (studentId) => {
    setProcessing(true);
    try {
      await axiosInstance.put(`/sports/${selectedSportId}/assign-vice-captain`, { studentId });
      alert("Vice Captain assigned successfully");
      fetchSportDetails(selectedSportId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to assign vice captain");
    } finally {
      setProcessing(false);
    }
  };

  const removeMember = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this sport?`)) return;
    setProcessing(true);
    try {
      await axiosInstance.put(`/sports/${selectedSportId}/remove-member/${studentId}`);
      alert("Member removed successfully");
      fetchSportDetails(selectedSportId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageWrapper title="Manage Team" subtitle="Assign team leaders and manage approved sport members.">
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
      {selectedSportId && loadingDetails && <LoadingSpinner text="Loading sport details..." />}

      {sportDetails && !loadingDetails && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <GlassCard>
              <div className="mb-3 inline-flex rounded-2xl bg-amber-400/15 p-3 text-amber-300"><Crown size={20} /></div>
              <h3 className="text-lg font-bold text-white">Captain</h3>
              <p className="mt-2 text-slate-300">{sportDetails.captain?.name || "Not assigned"}</p>
            </GlassCard>
            <GlassCard>
              <div className="mb-3 inline-flex rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><Medal size={20} /></div>
              <h3 className="text-lg font-bold text-white">Vice Captain</h3>
              <p className="mt-2 text-slate-300">{sportDetails.viceCaptain?.name || "Not assigned"}</p>
            </GlassCard>
            <GlassCard>
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><Users size={20} /></div>
              <h3 className="text-lg font-bold text-white">Total Members</h3>
              <p className="mt-2 text-slate-300">{sportDetails.members?.length || 0}</p>
            </GlassCard>
          </div>

          {!sportDetails.members || sportDetails.members.length === 0 ? (
            <GlassCard><p className="text-slate-300">No members in this sport yet.</p></GlassCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sportDetails.members.map((member) => (
                <GlassCard key={member._id}>
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>Email: {member.email}</p>
                    <p>Role: {member.role}</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <button onClick={() => assignCaptain(member._id)} disabled={processing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400/15 px-4 py-3 font-semibold text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-70">
                      <Crown size={16} /> Assign Captain
                    </button>
                    <button onClick={() => assignViceCaptain(member._id)} disabled={processing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 px-4 py-3 font-semibold text-cyan-300 transition hover:bg-cyan-400/25 disabled:opacity-70">
                      <Medal size={16} /> Assign Vice Captain
                    </button>
                    <button onClick={() => removeMember(member._id, member.name)} disabled={processing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400/15 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-400/25 disabled:opacity-70">
                      <UserMinus size={16} /> Remove Member
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}

export default ManageTeam;
