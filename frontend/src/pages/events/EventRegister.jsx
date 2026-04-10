import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/services';
import Button from '../../components/ui/Button';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    studentId: '', department: '', year: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await authService.register({
        name: formData.name, email: formData.email, password: formData.password,
        studentId: formData.studentId, department: formData.department, year: formData.year,
      });
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      register(user);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-8 dark:from-indigo-900 dark:via-slate-900 dark:to-violet-950">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="mb-6 text-center">
            <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">UniHub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Join Our Community</p>
          </div>

          <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">Create Account</h2>

          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputCls} placeholder="John Doe" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} placeholder="you@email.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Student ID</label>
              <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} className={inputCls} placeholder="2024001" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Department</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} className={inputCls} placeholder="CS" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Year</label>
                <select name="year" value={formData.year} onChange={handleChange} className={inputCls}>
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputCls} placeholder="••••••••" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputCls} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="mt-2 w-full" isLoading={loading} disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 focus-visible:outline-none focus-visible:underline">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
