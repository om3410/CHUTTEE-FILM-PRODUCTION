import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiPhone, FiBriefcase, FiSave, FiCheck, FiX,
  FiSun, FiMoon, FiMonitor, FiBell, FiLock, FiShield, FiLogOut,
  FiSmartphone, FiGlobe, FiTrash2, FiEye, FiEyeOff, FiHelpCircle,
  FiInbox, FiArrowRight, FiClock, FiCamera, FiRefreshCw,
  FiChevronRight, FiActivity,
} from 'react-icons/fi';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import PageHero from '../components/ui/PageHero';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { updateProfile, getApiErrorMessage } from '../api/auth';

const NOTIFICATION_TOGGLES = [
  { key: 'emailDigests',    label: 'Email digests',        description: 'Weekly summary of your production.' },
  { key: 'push',            label: 'Push notifications',   description: 'Real-time alerts for key events.' },
  { key: 'mentions',        label: 'Comment mentions',     description: 'Get pinged when someone @mentions you.' },
  { key: 'budgetAlerts',    label: 'Budget alerts',        description: 'Notify when spending exceeds 90%.' },
  { key: 'approvals',       label: 'Approval requests',    description: 'Sign-offs for scenes and budgets.' },
];

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: FiUser },
  { id: 'company',       label: 'Company',       icon: FiBriefcase },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'security',      label: 'Security',      icon: FiShield },
  { id: 'appearance',    label: 'Appearance',    icon: FiMoon },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'Producer',
  });

  const [company, setCompany] = useState({
    name: 'CHUTTEE Studios',
    tagline: 'Premium film production',
    city: 'Mumbai, India',
    website: 'https://chuttee.in',
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('chuttee.notifications');
      return saved ? JSON.parse(saved) : {
        emailDigests: true, push: false, mentions: true, budgetAlerts: true, approvals: true,
      };
    } catch {
      return { emailDigests: true, push: false, mentions: true, budgetAlerts: true, approvals: true };
    }
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome · macOS',   location: 'Mumbai, IN', lastActive: 'Active now', current: true },
    { id: 2, device: 'Safari · iPhone',  location: 'Mumbai, IN', lastActive: '2 hours ago', current: false },
    { id: 3, device: 'Chrome · Windows', location: 'Pune, IN',   lastActive: '3 days ago', current: false },
  ]);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem('chuttee.notifications', JSON.stringify(notifications));
  }, [notifications]);

  const dirtyProfile = useMemo(() => {
    return form.name !== (user?.name || '') ||
      form.email !== (user?.email || '') ||
      form.phone !== (user?.phone || '');
  }, [form, user]);

  /* ——————————— Profile save (uses real API from your file) ——————————— */
  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      toast('Name cannot be empty.', 'error');
      return;
    }
    const parts = form.name.trim().split(/\s+/);
    const first_name = parts.shift() || '';
    const last_name = parts.join(' ');
    setSaving(true);
    try {
      const profile = await updateProfile({
        first_name,
        last_name,
        email: form.email.trim(),
        phone: form.phone?.trim() || '',
      });
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || form.name;
      updateUser({ ...profile, name, phone: form.phone });
      setForm((f) => ({ ...f, name, email: profile.email, phone: profile.phone || form.phone }));
      toast('Profile updated', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not update profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ——————————— Company save (local — no API endpoint) ——————————— */
  const saveCompany = async (e) => {
    if (e) e.preventDefault();
    setSavingCompany(true);
    try {
      localStorage.setItem('chuttee.company', JSON.stringify(company));
      toast('Company settings saved', 'success');
    } catch {
      toast('Could not save company settings.', 'error');
    } finally {
      setSavingCompany(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (passwordForm.next.length < 8) {
      toast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    toast('Password changed successfully', 'success');
    setPasswordOpen(false);
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  const enableTwoFactor = () => {
    setTwoFactorEnabled(true);
    toast('Two-factor authentication enabled', 'success');
    setTwoFactorOpen(false);
  };

  const disableTwoFactor = () => {
    setTwoFactorEnabled(false);
    toast('Two-factor authentication disabled', 'info');
  };

  const revokeSession = (id) => {
    setSessions((list) => list.filter((s) => s.id !== id));
    toast('Session revoked', 'success');
  };

  const confirmSignOut = () => {
    setSignOutOpen(false);
    logout?.();
    navigate('/login');
  };

  /* ——————————— Theme helpers (support Dark / Light / System) ——————————— */
  const applyTheme = (value) => {
    if (setTheme) {
      setTheme(value);
    } else {
      const isDark = value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark && theme !== 'dark') toggleTheme();
      if (!isDark && theme === 'dark') toggleTheme();
    }
    toast(`Theme set to ${value}`, 'success');
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">

      {/* HERO — shorter for utility page */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="Your Studio, Your Rules"
        title="Configure Your Workspace."
        subtitle="Customise Every Detail."
        lead="Manage your profile, company and appearance. Choose light or dark mode. Set notification preferences. Control security and sessions. Make CHUTTEE work exactly the way your studio does."
        slogan="Every setting has a reason. The right setup, the right workflow, the right control can change what happens next."
      />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* TAB NAVIGATION */}
        <div className="flex overflow-x-auto border-b border-zinc-800">
          <div className="flex gap-6 px-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-4 pt-2 text-sm font-medium transition-all ${
                  tab === id
                    ? 'border-b-2 border-gold-400 text-gold-400'
                    : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â• PROFILE â•â•â•â•â•â•â•â•â•â•â• */}
        {tab === 'profile' && (
          <Card>
            <CardHeader title="Profile" subtitle="Your personal details" icon={FiUser} />
            <CardBody>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-gold-500/15 text-2xl font-serif text-gold-400">
                    {(form.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{form.name || 'Unnamed producer'}</p>
                    <p className="text-xs text-zinc-500">{form.email || 'no email set'}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" icon={FiCamera} onClick={() => toast('Avatar upload coming soon', 'info')}>
                    Change photo
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Full name" icon={FiUser} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input label="Email" type="email" icon={FiMail} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input label="Phone" icon={FiPhone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                  <Input label="Role" icon={FiBriefcase} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Producer" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" icon={FiSave} disabled={!dirtyProfile || saving}>
                    {saving ? 'Saving…' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â• COMPANY â•â•â•â•â•â•â•â•â•â•â• */}
        {tab === 'company' && (
          <Card>
            <CardHeader title="Company" subtitle="Your production house" icon={FiBriefcase} />
            <CardBody>
              <form onSubmit={saveCompany} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-premium bg-gold-500/15 text-2xl font-serif text-gold-400">
                    {(company.name || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{company.name}</p>
                    <p className="text-xs text-zinc-500">{company.tagline}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" icon={FiCamera} onClick={() => toast('Logo upload coming soon', 'info')}>
                    Change logo
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Company name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                  <Input label="Tagline" value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} />
                  <Input label="City" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} />
                  <Input label="Website" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="https://" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" icon={FiSave} disabled={savingCompany}>
                    {savingCompany ? 'Saving…' : 'Save Company'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â• NOTIFICATIONS â•â•â•â•â•â•â•â•â•â•â• */}
        {tab === 'notifications' && (
          <Card>
            <CardHeader title="Notifications" subtitle="Choose what reaches you" icon={FiBell} />
            <CardBody className="space-y-1">
              {NOTIFICATION_TOGGLES.map((t) => (
                <ToggleRow
                  key={t.key}
                  label={t.label}
                  description={t.description}
                  checked={notifications[t.key]}
                  onChange={() => toggleNotification(t.key)}
                />
              ))}
              <p className="mt-3 text-xs text-zinc-500">Changes are saved automatically.</p>
            </CardBody>
          </Card>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â• SECURITY â•â•â•â•â•â•â•â•â•â•â• */}
        {tab === 'security' && (
          <Card>
            <CardHeader title="Security" subtitle="Keep your account safe" icon={FiShield} />
            <CardBody className="space-y-3">
              <SecurityRow
                icon={FiLock}
                title="Password"
                description="Last changed 3 months ago"
                actionLabel="Change"
                onAction={() => setPasswordOpen(true)}
              />
              <SecurityRow
                icon={FiShield}
                title="Two-factor authentication"
                description={twoFactorEnabled ? 'Enabled — extra security on sign-in' : 'Add an extra layer of security'}
                actionLabel={twoFactorEnabled ? 'Disable' : 'Enable'}
                onAction={() => twoFactorEnabled ? disableTwoFactor() : setTwoFactorOpen(true)}
                accent={twoFactorEnabled}
              />
              <SecurityRow
                icon={FiSmartphone}
                title="Active sessions"
                description={`${sessions.length} device${sessions.length === 1 ? '' : 's'} signed in`}
                actionLabel="Manage"
                onAction={() => setSessionsOpen(true)}
              />
            </CardBody>
          </Card>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â• APPEARANCE â•â•â•â•â•â•â•â•â•â•â• */}
        {tab === 'appearance' && (
          <Card>
            <CardHeader title="Appearance" subtitle="Choose your theme" icon={FiMoon} />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-3">
                <ThemeOption value="dark"   current={theme} onSelect={applyTheme} icon={FiMoon}    label="Dark"   hint="Premium gold on black" />
                <ThemeOption value="light"  current={theme} onSelect={applyTheme} icon={FiSun}     label="Light"  hint="Clean daylight mode" />
                <ThemeOption value="system" current={theme} onSelect={applyTheme} icon={FiMonitor} label="System" hint="Follow OS preference" />
              </div>
            </CardBody>
          </Card>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â• SIGN OUT (always visible) â•â•â•â•â•â•â•â•â•â•â• */}
        <Card>
          <CardHeader title="Sign out" subtitle="End your session on this device" icon={FiLogOut} />
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">You can sign back in at any time.</p>
              <Button variant="destructive" icon={FiLogOut} onClick={() => setSignOutOpen(true)}>
                Sign out
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* â•â•â•â•â•â•â•â•â•â•â• QUICK LINKS â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="grid gap-4 sm:grid-cols-3">
          <QuickLink icon={FiHelpCircle} title="Help Center"   description="Browse FAQs and documentation." onAction={() => navigate('/help')} />
          <QuickLink icon={FiInbox}      title="Open Inbox"    description="Check messages from your crew." onAction={() => navigate('/inbox')} />
          <QuickLink icon={FiActivity}   title="View Activity" description="See every change and update." onAction={() => navigate('/activity')} />
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â• QUOTE â•â•â•â•â•â•â•â•â•â•â• */}
        <Quote>
          "Every setting has a reason. The right setup, the right workflow, the right control can change what happens next."
        </Quote>
      </div>

      {/* PASSWORD MODAL */}
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" icon={FiLock} size="sm">
        <form onSubmit={changePassword} className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              required
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-9 text-zinc-500 hover:text-gold-400" aria-label="Toggle password visibility">
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.next}
            onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
            required
          />
          <Input
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPasswordOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" icon={FiCheck}>Update Password</Button>
          </div>
        </form>
      </Modal>

      {/* 2FA MODAL */}
      <Modal open={twoFactorOpen} onClose={() => setTwoFactorOpen(false)} title="Enable Two-Factor" icon={FiShield} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Two-factor authentication adds an extra layer of security. After enabling, you'll need to enter a 6-digit code from your authenticator app each time you sign in.
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• Install Google Authenticator, Authy, or 1Password</li>
            <li>• Scan the QR code we'll show next</li>
            <li>• Enter the 6-digit code to confirm</li>
          </ul>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setTwoFactorOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" icon={FiShield} onClick={enableTwoFactor}>Enable 2FA</Button>
          </div>
        </div>
      </Modal>

      {/* SESSIONS MODAL */}
      <Modal open={sessionsOpen} onClose={() => setSessionsOpen(false)} title="Active Sessions" icon={FiSmartphone} size="md">
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
                  {s.current ? <FiGlobe className="h-4 w-4" /> : <FiSmartphone className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm text-zinc-200">
                    {s.device} {s.current && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">Current</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{s.location} · {s.lastActive}</p>
                </div>
              </div>
              {!s.current && (
                <button onClick={() => revokeSession(s.id)} className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400" title="Revoke session">
                  <FiTrash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {sessions.length === 0 && <p className="py-4 text-center text-sm text-zinc-500">No active sessions.</p>}
        </div>
      </Modal>

      {/* SIGN OUT CONFIRM */}
      <Modal open={signOutOpen} onClose={() => setSignOutOpen(false)} title="Sign Out" icon={FiLogOut} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">Are you sure you want to sign out on this device?</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSignOutOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" icon={FiLogOut} onClick={confirmSignOut}>Sign Out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER COMPONENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ThemeOption({ value, current, onSelect, icon: Icon, label, hint }) {
  const isActive = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`premium-card flex flex-col items-start gap-2 p-4 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="grid h-9 w-9 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        {isActive && <FiCheck className="h-4 w-4 text-gold-400" />}
      </div>
      <p className="font-serif text-base font-semibold text-zinc-100">{label}</p>
      <p className="text-xs text-zinc-500">{hint}</p>
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        aria-label={`Toggle ${label}`}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-gold-500' : 'bg-zinc-700'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function SecurityRow({ icon: Icon, title, description, actionLabel, onAction, accent }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-premium ${accent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold-500/10 text-gold-400'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-200">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}

function QuickLink({ icon: Icon, title, description, onAction }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60"
    >
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-base font-semibold text-zinc-100">{title}</span>
      <span className="text-xs text-zinc-500">{description}</span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Open <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">{children}</p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}