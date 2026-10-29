import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authenticate, getApiErrorMessage } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login({ requiredRole = null }) {
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.passwordReset) {
      toast('Password reset. You can now sign in.', 'success');
      navigate('/login', { replace: true, state: null });
    }
    const message = sessionStorage.getItem('chuttee-auth-message');
    if (message) {
      sessionStorage.removeItem('chuttee-auth-message');
      toast(message, 'error');
    }
  }, [location.state, navigate, toast]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await authenticate(username, password);
      if (requiredRole === 'CREW' && user.role !== 'CREW') {
        throw new Error('This sign-in page is for crew member accounts only.');
      }
      if (requiredRole === 'SUPERUSER' && !user.is_superuser) {
        throw new Error('This sign-in page is for superuser accounts only.');
      }
      setAuth(token, user);
      toast('Welcome back to CHUTTEE', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to sign in'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {requiredRole === 'CREW' ? 'Crew member sign in' : requiredRole === 'SUPERUSER' ? 'Superuser sign in' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {requiredRole ? 'Use your own CHUTTEE account credentials' : 'Sign in to your CHUTTEE account'}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email or username" type="text" icon={FiUser} value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" icon={FiLock} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} iconRight={!loading ? FiArrowRight : undefined}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <FiShield className="h-3.5 w-3.5" />
          <span>Secured with end-to-end encryption</span>
        </div>
        {!requiredRole && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            New here? <Link to="/register" className="font-medium text-gold-400 hover:underline">Create an account</Link>
          </p>
        )}
        <p className="mt-3 text-center text-sm text-zinc-500">
          Forgot your username or password? <Link to="/account-recovery" className="font-medium text-gold-400 hover:underline">Recover account</Link>
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {requiredRole === 'CREW' ? (
            <><Link to="/admin-login" className="font-medium text-gold-400 hover:underline">Superuser sign in</Link> · <Link to="/login" className="font-medium text-gold-400 hover:underline">General sign in</Link></>
          ) : requiredRole === 'SUPERUSER' ? (
            <><Link to="/crew-login" className="font-medium text-gold-400 hover:underline">Crew sign in</Link> · <Link to="/login" className="font-medium text-gold-400 hover:underline">General sign in</Link></>
          ) : (
            <><Link to="/crew-login" className="font-medium text-gold-400 hover:underline">Crew sign in</Link> · <Link to="/admin-login" className="font-medium text-gold-400 hover:underline">Superuser sign in</Link></>
          )}
        </p>
      </motion.div>
    </div>
  );
}