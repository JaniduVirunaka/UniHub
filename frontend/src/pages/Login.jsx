import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const routeAfterLogin = async () => {
    navigate('/home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(formData.email, formData.password);
      await routeAfterLogin();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      await routeAfterLogin();
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            <Button type="submit" className="mt-1 w-full">Log In</Button>
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
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
