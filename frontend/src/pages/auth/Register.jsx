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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData);
      alert("Registration successful");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Register failed");
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the sports management system and get started."
      sideTitle="Start with a clean and modern experience."
      sideText="Register quickly and access a role-based sports platform designed for students and team leaders."
    >
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
