import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import axiosInstance from "../../api/axios";
import PageWrapper from "../../components/PageWrapper";
import GlassCard from "../../components/GlassCard";
import FormInput from "../../components/FormInput";

function CreateSport() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post("/sports", formData);
      alert("Sport created successfully");
      setFormData({ name: "", description: "", category: "" });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create sport");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Create Sport"
      subtitle="Add a new sport to the platform with its basic details."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="h-fit">
          <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
            <Trophy size={22} />
          </div>
          <h2 className="text-2xl font-bold text-white">Create a New Sport</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Add a sport name, short description, and category. Once created,
            students can start sending join requests.
          </p>
        </GlassCard>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Sport Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter sport name"
              required
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter sport description"
                className="min-h-[130px] w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <FormInput
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Example: Indoor / Outdoor"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating Sport..." : "Create Sport"}
            </motion.button>
          </form>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}

export default CreateSport;
