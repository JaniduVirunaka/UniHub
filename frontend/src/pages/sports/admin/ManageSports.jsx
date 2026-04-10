import { useEffect, useState } from "react";
import { Pencil, Trash2, Trophy } from "lucide-react";
import axiosInstance from "../../../api/axios";
import PageWrapper from "../../../components/PageWrapper";
import LoadingSpinner from "../../../components/LoadingSpinner";
import GlassCard from "../../../components/GlassCard";
import FormInput from "../../../components/FormInput";

function ManageSports() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "" });

  const fetchSports = async () => {
    try {
      const response = await axiosInstance.get("/sports");
      setSports(response.data);
    } catch (error) {
      alert("Failed to load sports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSports(); }, []);

  const startEdit = (sport) => {
    setEditingId(sport._id);
    setEditForm({ name: sport.name || "", description: sport.description || "", category: sport.category || "" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm({ name: "", description: "", category: "" });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (sportId) => {
    try {
      await axiosInstance.put(`/sports/${sportId}`, editForm);
      alert("Sport updated successfully");
      cancelEdit();
      fetchSports();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update sport");
    }
  };

  const handleDelete = async (sportId) => {
    if (!window.confirm("Are you sure you want to delete this sport?")) return;
    try {
      await axiosInstance.delete(`/sports/${sportId}`);
      alert("Sport deleted successfully");
      fetchSports();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete sport");
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Manage Sports" subtitle="Edit, review, and remove sports from the system.">
        <LoadingSpinner text="Loading sports..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Manage Sports" subtitle="Keep the sports catalog updated and well organized.">
      {sports.length === 0 ? (
        <GlassCard><p className="text-slate-600 dark:text-slate-300">No sports found.</p></GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sports.map((sport) => (
            <GlassCard key={sport._id}>
              {editingId === sport._id ? (
                <div className="space-y-4">
                  <FormInput label="Sport Name" name="name" value={editForm.name} onChange={handleEditChange} placeholder="Enter sport name" />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:border-emerald-400/60 dark:focus-visible:ring-emerald-400/20"
                    />
                  </div>
                  <FormInput label="Category" name="category" value={editForm.category} onChange={handleEditChange} placeholder="Enter category" />
                  <div className="flex gap-3">
                    <button onClick={() => handleUpdate(sport._id)} className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">Save</button>
                    <button onClick={cancelEdit} className="flex-1 rounded-2xl border border-slate-300 bg-white/60 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-600 dark:text-emerald-300"><Trophy size={20} /></div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{sport.name}</h3>
                  <p className="mt-3 min-h-[70px] text-sm leading-6 text-slate-600 dark:text-slate-300">{sport.description || "No description available."}</p>
                  <p className="mt-2 text-sm text-cyan-700 dark:text-cyan-300">Category: {sport.category || "Not specified"}</p>
                  <div className="mt-6 flex gap-3">
                    <button onClick={() => startEdit(sport)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-50 px-4 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:bg-cyan-400/15 dark:text-cyan-300 dark:hover:bg-cyan-400/25">
                      <Pencil size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(sport._id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-400/15 dark:text-rose-300 dark:hover:bg-rose-400/25">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default ManageSports;
