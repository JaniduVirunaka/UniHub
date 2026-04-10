import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/signup', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/clubs');
    } catch {
      setError('Google Authentication Failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 py-8 dark:from-indigo-900 dark:via-slate-900 dark:to-violet-950">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="mb-6 text-center">
            <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">UniHub</h1>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Join UniHub</h2>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
              Account created! Redirecting to login…
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="sr-only">Full Name</span>
              <input type="text" className={inputCls} placeholder="Full Name" required
                onChange={e => setFormData(d => ({ ...d, name: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="sr-only">University Email</span>
              <input type="email" className={inputCls} placeholder="University Email" required
                onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="sr-only">Password</span>
              <input type="password" className={inputCls} placeholder="Password" required
                onChange={e => setFormData(d => ({ ...d, password: e.target.value }))} />
            </label>
            <Button type="submit" className="mt-1 w-full">Sign Up</Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-slate-200 dark:border-white/10" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">OR</span>
            <hr className="flex-1 border-slate-200 dark:border-white/10" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Login Failed')} theme="outline" size="large" />
          </div>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
