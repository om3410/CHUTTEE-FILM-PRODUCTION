import { Link } from 'react-router-dom';
import { FiArrowLeft, FiHome } from 'react-icons/fi';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center animate-fade-in">
      <div className="rounded-2xl bg-gold-500/15 p-6 animate-scale-in"><FiHome className="h-12 w-12 text-gold-400" /></div>
      <h1 className="text-6xl font-bold text-gold-400">404</h1>
      <p className="text-zinc-400">This scene does not exist.</p>
      <Link to="/"><Button variant="primary" icon={FiArrowLeft}>Back to Dashboard</Button></Link>
    </div>
  );
}