import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock } from 'react-icons/fi';
import { confirmPasswordReset, getApiErrorMessage } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmPasswordReset(uid, token, password, password2);
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to reset your password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-zinc-400">Choose a strong password for your account.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="New password" type="password" icon={FiLock} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm new password" type="password" icon={FiLock} value={password2} onChange={(e) => setPassword2(e.target.value)} required />
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            {loading ? 'Updating…' : 'Reset password'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link to="/login" className="font-medium text-gold-400 hover:underline">Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}