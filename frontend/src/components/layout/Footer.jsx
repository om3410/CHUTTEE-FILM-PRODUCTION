import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} CHUTTEE Film Production. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:omrewaskar4@gmail.com" className="flex items-center gap-1.5 hover:text-gold-400"><FiMail size={12} /> omrewaskar4@gmail.com</a>
            <a href="tel:+917410114971" className="flex items-center gap-1.5 hover:text-gold-400"><FiPhone size={12} /> +91 74101 14971</a>
            <span className="flex items-center gap-1.5"><FiMapPin size={12} /> Mumbai, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
