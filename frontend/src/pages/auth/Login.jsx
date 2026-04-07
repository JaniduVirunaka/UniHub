import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import FormInput from "../../components/FormInput";

function Login() {
  const navigate = useNavigate();
  const { login, loading, user } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const redirectByRole = (role) => {
    if (role === "SPORT_ADMIN") return "/admin";
    if (role === "CAPTAIN") return "/captain";
    if (role === "VICE_CAPTAIN") return "/vice-captain";
    return "/student";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await login(formData);
      navigate(redirectByRole(response.user.role));
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue managing sports, teams, and requests."
      sideTitle="Control your sport operations beautifully."
      sideText="A modern and animated interface for managing student sport participation and leadership workflows."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
          placeholder="Enter your password"
          required
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </motion.button>
      </form>

      <p className="mt-6 text-sm text-slate-300">
        Do not have an account?{" "}
        <Link to="/register" className="font-semibold text-emerald-300 hover:text-emerald-200">
          Register here
        </Link>
      </p>

      {user && (
        <p className="mt-4 text-sm text-slate-400">
          Logged in as {user.name} ({user.role})
        </p>
      )}
    </AuthLayout>
  );
}

export default Login;