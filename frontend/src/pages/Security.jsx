import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiShield, FiLock, FiAlertTriangle, FiKey, FiEyeOff, FiActivity,
  FiArrowRight, FiCheckCircle, FiServer, FiUserCheck,
  FiRefreshCw, FiHelpCircle, FiInbox, FiZap, FiFileText, FiDownload,
} from 'react-icons/fi';
import { useSecurity } from '../context/SecurityContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PageHero from '../components/ui/PageHero';
import * as providerAllowlist from '../security/providerAllowlist';
import * as dataPort from '../security/dataPort';

export default function Security() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { events = [], threat, refresh } = useSecurity();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await dataPort.exportAll();
      toast('Security audit exported', 'success');
    } catch {
      toast('Unable to export audit data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const allowlist = providerAllowlist.getAllowlist();
  const blockedClasses = Object.entries(allowlist).filter(([, p]) => p.length === 0);
  const anomalyCount = threat?.anomalies?.length || 0;
  const riskScore = threat?.riskScore || 0;

  const pillars = [
    { number: '01', icon: FiShield,        eyebrow: 'Audit',            title: 'Every Call, Logged',          description: 'Every AI request, model response, and user action is recorded with a timestamp, actor, and outcome. Nothing happens off the record.' },
    { number: '02', icon: FiLock,          eyebrow: 'Data Residency',   title: 'Sensitive Data Never Leaves', description: 'Passwords, keys, PII, and financial data are blocked from leaving the browser. The allowlist enforces this at the network boundary.' },
    { number: '03', icon: FiAlertTriangle, eyebrow: 'Threat Detection', title: 'Anomalies Surface Early',     description: 'Login bursts, impossible travel, permission escalation, and prompt injection attempts are scored and flagged before they spread.' },
    { number: '04', icon: FiKey,           eyebrow: 'Access Control',   title: 'Sessions That Expire',        description: 'Idle sessions auto-lock. Tokens are short-lived. Every privileged action is re-verified against the current role and device.' },
  ];

  const signals = [
    { label: 'Audit events',     value: events.length,           note: 'Across all users',                             color: 'text-gold-400' },
    { label: 'Active anomalies', value: anomalyCount,            note: anomalyCount ? 'Needs review' : 'All clear',    color: anomalyCount ? 'text-red-400' : 'text-emerald-400' },
    { label: 'Login successes',  value: threat?.successes || 0,  note: 'Recent window',                                color: 'text-emerald-400' },
    { label: 'Risk score',       value: `${riskScore}%`,         note: riskScore > 60 ? 'Elevated' : 'Normal',         color: riskScore > 60 ? 'text-amber-400' : 'text-emerald-400' },
  ];

  return (
    <div className="space-y-16 animate-fade-in">
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="Security by Default"
        title="Trust Is Not a Feature."
        subtitle="It Is the Foundation."
        lead="CHUTTEE treats every film production as a security boundary. Scripts, contracts, call sheets and payment data flow through the same pipeline — and that pipeline is audited, masked, and gated at every step. Here is what that means in practice."
        slogan="A production is only as safe as the weakest handoff. Every crew member, every vendor, every AI call is part of the trust perimeter — and CHUTTEE holds that perimeter with intent."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {signals.map((s) => (
          <div key={s.label} className="premium-card p-6">
            <p className={`font-serif text-4xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{s.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.note}</p>
          </div>
        ))}
      </section>

      <Quote>
        "Security is not a lock on the door. It is the set of habits that keep the door locked even when everyone is tired and moving fast."
      </Quote>

      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Four Pillars</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What CHUTTEE Guards.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every production touches four boundaries. CHUTTEE is designed to hold all four simultaneously.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ number, icon: Icon, eyebrow, title, description }) => (
            <div key={number} className="premium-card group flex flex-col p-6 transition-all hover:border-gold-500/40">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">
                  {number} · {eyebrow}
                </p>
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-zinc-100">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Provider Allowlist</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Data Is Allowed to Leave the Browser.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Each data class has an explicit list of providers it may be sent to. If the class is not on a
            provider's list, the request is blocked before it ever reaches the network.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Object.entries(allowlist).map(([cls, providers]) => (
            <div key={cls} className="flex items-center justify-between rounded-premium border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize text-zinc-100">{cls}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {providers.length === 0 ? 'Never leaves the browser' : `→ ${providers.join(', ')}`}
                </p>
              </div>
              <Badge variant={providers.length === 0 ? 'danger' : 'success'}>
                {providers.length === 0 ? 'Blocked' : 'Allowed'}
              </Badge>
            </div>
          ))}
        </div>

        {blockedClasses.length > 0 && (
          <p className="mt-4 text-xs text-zinc-500">
            {blockedClasses.length} data class{blockedClasses.length === 1 ? '' : 'es'} are hard-blocked from
            leaving the browser. This is intentional.
          </p>
        )}
      </section>

      <Quote>
        "The safest data is the data that never travels. The second safest is the data that travels only where it must — and returns without a trail."
      </Quote>

      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Threat Signals</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            What Is Being Watched Right Now.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            The anomaly engine runs client-side. It scores recent activity against known patterns and surfaces
            anything that does not fit the baseline.
          </p>
        </div>

        <div className="mt-8">
          {anomalyCount === 0 ? (
            <div className="premium-card flex items-center gap-3 p-6">
              <FiCheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-zinc-300">No anomalies detected in the current window.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threat.anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-premium border border-red-500/20 bg-red-500/5 p-4">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-100">{a.type}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{a.detail}</p>
                  </div>
                  <Badge variant={a.severity === 'High' ? 'danger' : 'warn'}>{a.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Security Center</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">
              Full Audit, Live Demos, Session Controls.
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              The Security Center is where every event, anomaly, and session lives. It is the operational
              counterpart to this page.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-zinc-300">
              <FiFileText className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>Export the full audit trail as JSON</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300">
              <FiZap className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>Run prompt-injection and PII demos live</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-zinc-300">
              <FiUserCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>Review and revoke active sessions</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="sm" icon={FiShield} onClick={() => navigate('/security-center')}>
              Open Security Center
            </Button>
            <Button variant="outline" size="sm" icon={FiServer} onClick={() => navigate('/settings')}>
              Provider Settings
            </Button>
            <Button variant="outline" size="sm" icon={FiDownload} loading={exporting} onClick={handleExport}>
              Export Audit Data
            </Button>
            <Button variant="ghost" size="sm" icon={FiRefreshCw} onClick={refresh}>
              Refresh Signals
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Next Steps</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Where Would You Like to Go?
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiShield}
            title="Security Center"
            description="Audit log, anomalies, session monitor, and live demos."
            onAction={() => navigate('/security-center')}
          />
          <QuickAction
            icon={FiEyeOff}
            title="Privacy Mask Demo"
            description="See how PII is detected and redacted before it leaves."
            onAction={() => navigate('/security-center')}
          />
          <QuickAction
            icon={FiActivity}
            title="Activity Log"
            description="Review the full production activity feed."
            onAction={() => navigate('/activity')}
          />
        </div>
      </section>

      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact Security</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">
              Found Something? Tell Us.
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Responsible disclosure is always welcome. We respond within 48 hours.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:omrewaskar4@gmail.com" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">
              omrewaskar4@gmail.com
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+917410111497" className="mt-2 block text-sm text-zinc-300 hover:text-gold-400 transition-colors">
              +91 74101 11497
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Office</p>
            <p className="mt-2 text-sm text-zinc-300">Mumbai, Maharashtra, India</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out for a scoped review, a penetration test, or a feature request.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">
        {children}
      </p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60"
    >
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}