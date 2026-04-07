import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { Home, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateSport from "./pages/admin/CreateSport";
import ManageSports from "./pages/admin/ManageSports";
import ManageRequests from "./pages/admin/ManageRequests";
import ManageTeam from "./pages/admin/ManageTeam";
import StudentDashboard from "./pages/student/StudentDashboard";
import CaptainDashboard from "./pages/captain/CaptainDashboard";
import CaptainRequests from "./pages/captain/CaptainRequests";
import ViceCaptainDashboard from "./pages/viceCaptain/ViceCaptainDashboard";
import ViceCaptainRequests from "./pages/viceCaptain/ViceCaptainRequests";
import SportsList from "./pages/student/SportsList";
import SportDetails from "./pages/student/SportDetails";
import MyRequests from "./pages/student/MyRequests";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function HomePage() {
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-6xl items-center justify-center px-4">
      <div className="grid w-full items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
            ITP Sport Management System
          </div>

          <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
            Modern Sports Team Management Platform
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            Manage sports, student join requests, captain roles, vice captain
            roles, and team operations with a clean and animated interface.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-lg font-semibold text-white">Sport Admin</h3>
              <p className="mt-2 text-sm text-slate-300">
                Create sports, approve students, assign leaders, and manage teams.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-lg font-semibold text-white">Captain</h3>
              <p className="mt-2 text-sm text-slate-300">
                Review requests and help manage the sport team workflow.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-lg font-semibold text-white">Vice Captain</h3>
              <p className="mt-2 text-sm text-slate-300">
                Support approvals and team coordination for the assigned sport.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <h3 className="text-lg font-semibold text-white">Student</h3>
              <p className="mt-2 text-sm text-slate-300">
                Browse sports, apply to join, and track request progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, icon, children }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-emerald-400 text-slate-950"
          : "bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function App() {
  const { user, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "SPORT_ADMIN") return "/admin";
    if (user.role === "CAPTAIN") return "/captain";
    if (user.role === "VICE_CAPTAIN") return "/vice-captain";
    return "/student";
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white">
              ITP Sport
            </h1>
            <p className="text-xs text-slate-400">
              Smart university sports management
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" icon={<Home size={16} />}>
              Home
            </NavLink>

            {!user && (
              <>
                <NavLink to="/login" icon={<LogIn size={16} />}>
                  Login
                </NavLink>
                <NavLink to="/register" icon={<UserPlus size={16} />}>
                  Register
                </NavLink>
              </>
            )}

            {user && (
              <>
                <NavLink to={getDashboardPath()} icon={<LayoutDashboard size={16} />}>
                  Dashboard
                </NavLink>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {user.name} · {user.role}
                </div>

                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={user ? <Navigate to={getDashboardPath()} replace /> : <Login />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to={getDashboardPath()} replace /> : <Register />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["SPORT_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-sport"
          element={
            <ProtectedRoute allowedRoles={["SPORT_ADMIN"]}>
              <CreateSport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-sports"
          element={
            <ProtectedRoute allowedRoles={["SPORT_ADMIN"]}>
              <ManageSports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute allowedRoles={["SPORT_ADMIN"]}>
              <ManageRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute allowedRoles={["SPORT_ADMIN"]}>
              <ManageTeam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/sports"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SportsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/sports/:id"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <SportDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-requests"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/captain"
          element={
            <ProtectedRoute allowedRoles={["CAPTAIN"]}>
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/captain/requests"
          element={
            <ProtectedRoute allowedRoles={["CAPTAIN"]}>
              <CaptainRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vice-captain"
          element={
            <ProtectedRoute allowedRoles={["VICE_CAPTAIN"]}>
              <ViceCaptainDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vice-captain/requests"
          element={
            <ProtectedRoute allowedRoles={["VICE_CAPTAIN"]}>
              <ViceCaptainRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;