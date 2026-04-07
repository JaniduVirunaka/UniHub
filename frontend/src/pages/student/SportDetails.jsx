import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Layers3, Users } from "lucide-react";
import axiosInstance from "../../api/axios";
import PageWrapper from "../../components/PageWrapper";
import LoadingSpinner from "../../components/LoadingSpinner";
import GlassCard from "../../components/GlassCard";
import FormInput from "../../components/FormInput";
import { motion } from "framer-motion";

function SportDetails() {
  const { id } = useParams();

  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nic: "",
    name: "",
    registrationNumber: "",
    email: "",
    phone: "",
    height: "",
    weight: "",
    extraSkills: ""
  });

  const fetchSport = async () => {
    try {
      const response = await axiosInstance.get(`/sports/${id}`);
      setSport(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load sport details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSport();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      await axiosInstance.post(`/requests/${id}`, {
        ...formData,
        height: Number(formData.height),
        weight: Number(formData.weight)
      });

      alert("Join request sent successfully");

      setFormData({
        nic: "",
        name: "",
        registrationNumber: "",
        email: "",
        phone: "",
        height: "",
        weight: "",
        extraSkills: ""
      });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper
        title="Sport Details"
        subtitle="Loading sport information and application form."
      >
        <LoadingSpinner text="Loading sport details..." />
      </PageWrapper>
    );
  }

  if (!sport) {
    return (
      <PageWrapper title="Sport Details" subtitle="Requested sport could not be found.">
        <GlassCard>
          <p className="text-slate-300">Sport not found.</p>
        </GlassCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={sport.name}
      subtitle="Review the sport details and submit your join request."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <GlassCard className="h-fit">
          <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
            <Trophy size={22} />
          </div>

          <h2 className="text-2xl font-bold text-white">{sport.name}</h2>
          <p className="mt-3 leading-7 text-slate-300">
            {sport.description || "No description available for this sport yet."}
          </p>

          <div className="mt-6 grid gap-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Layers3 size={18} className="text-cyan-300" />
              <span>Category: {sport.category || "Not specified"}</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300">
              <Users size={18} className="text-cyan-300" />
              <span>Total Members: {sport.members?.length || 0}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-bold text-white">Join This Sport</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Fill in your student and physical details carefully before submitting your request.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <FormInput
              label="NIC"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="Enter NIC"
              required
            />

            <FormInput
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />

            <FormInput
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="Enter registration number"
              required
            />

            <FormInput
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />

            <FormInput
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />

            <FormInput
              label="Height"
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="Enter height"
              required
            />

            <FormInput
              label="Weight"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="Enter weight"
              required
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Extra Skills
              </label>
              <textarea
                name="extraSkills"
                value={formData.extraSkills}
                onChange={handleChange}
                placeholder="Describe your extra skills"
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div className="md:col-span-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting Request..." : "Send Join Request"}
              </motion.button>
            </div>
          </form>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}

export default SportDetails;