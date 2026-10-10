import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage, registerAndAuthenticate } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await registerAndAuthenticate(form);
      login(token, user);
      toast('Registration successful! You are now signed in.', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      toast(getApiErrorMessage(error, 'Unable to create account'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Full name" icon={FiUser} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Google email" type="email" icon={FiMail} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Password" type="password" icon={FiLock} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have one? <Link to="/login" className="font-medium text-brand-400 hover:underline">Sign in</Link>
        </p>
        <p className="mt-3 text-center text-sm text-zinc-500">
          Forgot your username or password? <Link to="/account-recovery" className="font-medium text-brand-400 hover:underline">Recover account</Link>
        </p>
      </motion.div>
    </div>
  );
}