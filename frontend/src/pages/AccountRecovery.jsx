import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import { getApiErrorMessage, requestAccountRecovery } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function AccountRecovery() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestAccountRecovery(email);
      setSubmitted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to request account recovery.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Recover your account</h1>
          <p className="mt-1 text-sm text-zinc-400">Enter your registered email to receive your username and a password reset link.</p>
        </div>
        {submitted ? (
          <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            If an active account exists for that email, recovery instructions have been sent.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Registered email" type="email" icon={FiMail} value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {loading ? 'Sending…' : 'Send recovery email'}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Remember your details? <Link to="/login" className="font-medium text-gold-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}