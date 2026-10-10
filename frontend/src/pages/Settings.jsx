import { useState } from 'react';
import { FiUser, FiBell, FiLock, FiGlobe, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { updateProfile, getApiErrorMessage } from '../api/auth';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' '),
    email: user?.email || '',
  });

  const save = async () => {
    const [first_name, ...last_name] = form.name.trim().split(/\s+/);
    setSaving(true);
    try {
      const profile = await updateProfile({
        first_name: first_name || '',
        last_name: last_name.join(' '),
        email: form.email.trim(),
      });
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      updateUser({ ...profile, name });
      setForm({ name, email: profile.email });
      toast('Profile updated', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not update profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400">Manage your account and preferences.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'security', label: 'Security' },
          { id: 'appearance', label: 'Appearance' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'profile' && (
        <Card>
          <CardHeader title="Profile" subtitle="Your personal information" icon={FiUser} />
          <CardBody className="space-y-4">
            <Input label="Full name" icon={FiUser} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email address" icon={FiGlobe} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="flex justify-end"><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></div>
          </CardBody>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader title="Notifications" subtitle="Control what reaches you" icon={FiBell} />
          <CardBody className="space-y-3">
            {[
              ['Email digests', 'Weekly summary of your production'],
              ['Push notifications', 'Real-time alerts for key events'],
              ['Comment mentions', 'Get pinged when someone @mentions you'],
              ['Budget alerts', 'Notify when spending exceeds 90%'],
            ].map(([title, desc]) => (
              <label key={title} className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-zinc-800 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{title}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900" />
              </label>
            ))}
          </CardBody>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <CardHeader title="Security" subtitle="Keep your account safe" icon={FiLock} />
          <CardBody className="space-y-4">
            <Input label="Current password" type="password" icon={FiLock} placeholder="••••••••" />
            <Input label="New password" type="password" icon={FiLock} placeholder="••••••••" />
            <Input label="Confirm new password" type="password" icon={FiLock} placeholder="••••••••" />
            <div className="flex justify-end"><Button variant="primary" onClick={() => toast('Password changes are not connected to an authentication service yet', 'info')}>Update password</Button></div>
          </CardBody>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card>
          <CardHeader title="Appearance" subtitle="How CHUTTEE looks" icon={FiMoon} />
          <CardBody>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <FiMoon className="h-4 w-4 text-brand-400" /> : <FiSun className="h-4 w-4 text-brand-400" />}
                <div>
                  <p className="text-sm font-medium text-zinc-200">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
                  <p className="text-xs text-zinc-500">Toggle between light and dark themes</p>
                </div>
              </div>
              <Button variant="outline" onClick={toggleTheme}>Toggle theme</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}