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

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.endsWith('@gmail.com') && !form.email.endsWith('@googlemail.com')) {
      toast('Please use a Google email (@gmail.com)', 'error');
      return;
    }
    if (form.username.trim().length < 3) {
      toast('Username must be at least 3 characters.', 'error');
      return;
    }
    if (form.password.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (form.password !== form.password2) {
      toast("Passwords didn't match.", 'error');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await registerAndAuthenticate({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password2: form.password2,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-400">Use a Google email to get started</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            id="register-username"
            name="username"
            label="Username"
            type="text"
            icon={FiUser}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="e.g., OmRewaskar"
            autoComplete="username"
            required
          />

          <Input
            id="register-email"
            name="email"
            label="Google email"
            type="email"
            icon={FiMail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@gmail.com"
            autoComplete="email"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="register-first-name"
              name="first_name"
              label="First name (optional)"
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              autoComplete="given-name"
            />
            <Input
              id="register-last-name"
              name="last_name"
              label="Last name (optional)"
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              autoComplete="family-name"
            />
          </div>

          <Input
            id="register-password"
            name="password"
            label="Password"
            type="password"
            icon={FiLock}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <Input
            id="register-password2"
            name="password2"
            label="Confirm password"
            type="password"
            icon={FiLock}
            value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
            placeholder="Re-enter password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have one?{' '}
          <Link to="/login" className="font-medium text-gold-400 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-zinc-500">
          Forgot your username or password?{' '}
          <Link to="/account-recovery" className="font-medium text-gold-400 hover:underline">
            Recover account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}