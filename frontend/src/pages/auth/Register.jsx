import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import FormInput from "../../components/FormInput";

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the sports management system and get started."
      sideTitle="Start with a clean and modern experience."
      sideText="Register quickly and access a role-based sports platform designed for students and team leaders."
    >
      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Account created! Redirecting to login…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
        />

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        <FormInput
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Register"}
        </motion.button>
      </form>

      <p className="mt-6 text-sm text-slate-300">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
