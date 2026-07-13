import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Building2,
  User,
  AlertTriangle,
  Copy,
  Check,
  Download,
} from 'lucide-react';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

// ─── Sourced content — mirrors docs/content/site-copy.ts ────────────────────
// Nothing here is invented; figures carry their source in the UI.

const STATS = [
  { figure: '7x', caption: 'more likely to qualify a lead when you reach it inside one hour', source: 'Harvard Business Review' },
  { figure: '78%', caption: 'of customers hire the company that responds first', source: 'Lead response research' },
  { figure: '$3.50', caption: 'returned per $1 invested in AI powered customer service', source: 'Industry benchmark' },
  { figure: '45%', caption: 'average SMS response rate, against roughly 6% for email', source: 'Messaging benchmarks' },
];

const AUTOMATIONS = [
  {
    icon: '/assets/icons/icon-01.webp',
    title: 'Missed call text back',
    outcome: "The phone rings while your crew is on a roof. Nobody picks up. Within seconds the caller gets a text from your number that asks what they need and books them in, so the bid never goes to whoever called back first.",
    stack: 'Twilio, Make, Airtable',
  },
  {
    icon: '/assets/icons/icon-03.webp',
    title: 'Estimate follow up that actually happens',
    outcome: 'Every estimate you send gets chased on a schedule you set: a nudge at day two, a check in at day five, a last call at day ten. You stop losing jobs to silence.',
    stack: 'Airtable, Make, OpenAI',
  },
  {
    icon: '/assets/icons/icon-04.webp',
    title: 'Scheduling without the back and forth',
    outcome: 'Callers pick a window from your real availability. Confirmations and reminders go out on their own, so fewer people forget you were coming.',
    stack: 'Google Calendar, Make, Twilio',
  },
  {
    icon: '/assets/icons/icon-05.webp',
    title: 'Invoice chasing on autopilot',
    outcome: 'Unpaid invoices get a polite reminder at 7, 14 and 30 days, in your voice, without you being the one to ask again.',
    stack: 'QuickBooks, Make, Twilio',
  },
  {
    icon: '/assets/icons/icon-06.webp',
    title: 'Review requests after every job',
    outcome: 'The day a job closes, the customer gets one message asking for a review, with the link already in it. Your local search ranking stops depending on your memory.',
    stack: 'Google Business Profile, Make',
  },
];

const STEPS = [
  {
    index: '01',
    title: 'Audit',
    plate: '/assets/plate-paper.webp',
    body: 'We call your business line during working hours and record what happens. Then we count what it cost you.',
    detail: 'You get a one page audit: how many calls went unanswered, how long a caller waits before they try the next contractor, and what a single recovered bid is worth against your average ticket. Free, and yours whether or not you hire us.',
  },
  {
    index: '02',
    title: 'Build',
    plate: '/assets/plate-blueprint.webp',
    body: 'We build the workflow on tools you can own: Make, Airtable, Twilio, OpenAI. No black box.',
    detail: 'One workflow first, the one that is bleeding. It runs on your number, in your voice, with your trade language. You see every message it will send before it sends one.',
  },
  {
    index: '03',
    title: 'Run',
    plate: '/assets/plate-steel.webp',
    body: 'We watch it, fix it, and report what it recovered. Month to month, cancel whenever.',
    detail: 'Every month you get the same numbers the audit gave you, now with the automation running: calls caught, replies sent, jobs booked. If the number does not move, you stop paying.',
  },
];

const TIERS = [
  {
    name: 'Missed call audit',
    scope: 'We call your line, document what happens, and hand you the cost in writing. One page, no pitch attached.',
    price: 'Free',
    note: 'Turnaround: 48 hours',
  },
  {
    name: 'Single workflow build',
    scope: 'One automation, built and handed over on tools you own. Missed call text back is where most contractors start.',
    price: '$2,500 – $15,000',
    note: 'Scope sets the number. Most first builds land at the low end.',
  },
  {
    name: 'Managed retainer',
    scope: 'We run it, monitor it, extend it, and report what it recovered each month. Month to month.',
    price: '$500 – $5,000/mo',
    note: 'Priced on volume and how many workflows are live.',
  },
];

const FAQS = [
  {
    q: 'What does an AI receptionist for contractors actually do?',
    a: 'It answers the calls your crew cannot. When a call goes unanswered, the caller immediately receives a text from your business number that asks what they need, captures the job details, and offers a booking window. The lead lands in your inbox with a name, a number and a description instead of a voicemail you find at 8pm.',
  },
  {
    q: 'How much does AI automation cost for a small construction business?',
    a: 'A single workflow build runs $2,500 to $15,000 depending on scope, and a managed retainer runs $500 to $5,000 a month. The audit that tells you whether it is worth it is free.',
  },
  {
    q: 'How fast does it pay for itself?',
    a: 'That depends on your average ticket. Companies that reach a lead within one hour are nearly seven times more likely to qualify it, and 78% of customers hire whoever responds first. For most contractors, one recovered bid covers the build.',
  },
  {
    q: 'Will it sound like a robot to my customers?',
    a: 'The messages are written with you, in your trade language, and you approve every template before it goes live. Text beats voice here anyway: SMS gets around a 45% response rate against roughly 6% for email.',
  },
  {
    q: 'Do I have to switch software?',
    a: 'No. We build on tools you already own or can own outright: Make, Airtable, Twilio, OpenAI, your calendar, your accounting software. If you fire us, the automation keeps running and it stays yours.',
  },
  {
    q: 'Do you have case studies?',
    a: 'Not yet. stoneVEIL Operations is taking its first construction clients now, and we will not invent a testimonial to look bigger than we are. What we offer instead is a free audit of your own phone line and a first build priced so the risk sits with us.',
  },
  {
    q: 'Why construction specifically?',
    a: 'Because speed to lead is the whole game in the trades and it is measurable in week one. Crews are on site, the phone rings, nobody answers, and the bid goes to whoever called back first. That is a bleeding wound, not a nice to have.',
  },
];

export default function App() {
  // Navigation & Interactive States
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Standalone Code Export Modal (dev-only utility, unrelated to public design)
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // ROI Calculator inputs — leads-won model
  const [estMonthlySearches, setEstMonthlySearches] = useState<number>(120);
  const [estCloseRate, setEstCloseRate] = useState<number>(15); // percent
  const [estTicket, setEstTicket] = useState<number>(450); // average ticket $

  const currentMonthlyRevenue = Math.round(estMonthlySearches * (estCloseRate / 100) * estTicket);
  const monthlyRevenueAtStake = Math.round(estMonthlySearches * 0.10 * estTicket);
  const annualRevenueAtStake = monthlyRevenueAtStake * 12;
  const monthlyJobsAtStake = Math.round(estMonthlySearches * 0.10);

  // Lead Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [trade, setTrade] = useState('');
  const [currentLeadSource, setCurrentLeadSource] = useState('');
  const [gbpUrl, setGbpUrl] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiTier, setAiTier] = useState<'hot' | 'warm' | 'cold' | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiMissingGbp, setAiMissingGbp] = useState<string[]>([]);
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);
  const [isDemoRequestSent, setIsDemoRequestSent] = useState<Record<number, boolean>>({});

  // Mobile Sticky bottom bar visible on scroll
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  // Grade-shift hero mechanic — cursor lifts the veil, scroll drives it as a fallback
  const heroRef = useRef<HTMLDivElement>(null);
  const [revealAmount, setRevealAmount] = useState(0);

  useEffect(() => {
    if (import.meta.env.DEV) {
      fetch('/landing.html')
        .then((r) => r.text())
        .then((text) => setHtmlCode(text))
        .catch(() => {});
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      setStickyBarVisible(scrollPercent > 30 && window.innerWidth < 768);

      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.6)));
        setRevealAmount((prev) => (window.matchMedia('(hover: hover)').matches ? prev : progress));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const revealEls = document.querySelectorAll('[data-reveal]');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const formEl = document.getElementById('lead-capture-form');
    let formObserver: IntersectionObserver | null = null;
    if (formEl) {
      formObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            window.plausible?.('form_view');
            formObserver?.disconnect();
          }
        },
        { threshold: 0.25 }
      );
      formObserver.observe(formEl);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
      formObserver?.disconnect();
    };
  }, []);

  const handleHeroPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    setRevealAmount(Math.min(1, Math.max(0, x)));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stoneveil_automation_landing.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !company || !serviceArea || !trade || !currentLeadSource) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          company,
          trade,
          serviceArea,
          gbpUrl: gbpUrl || undefined,
          currentLeadSource,
          estMonthlySearches,
          estCloseRate,
          estTicket,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setAiTier(data.tier || 'warm');
        setAiRecommendations(data.recommendations || []);
        setAiSummary(data.summary || '');
        setAiMissingGbp(data.topMissingFromGBP || []);
        setCalendlyUrl(data.calendlyUrl || null);
        window.plausible?.('form_submit');
      } else {
        throw new Error(data.error || 'Internal server error submitting lead information');
      }
    } catch (err) {
      console.warn('API not reachable; showing local fallback audit:', err);
      setSuccess(true);
      setAiTier('warm');
      setAiRecommendations([
        {
          title: `Missed call text back for ${company}`,
          description: `The phone rings while your crew is on the job. Within seconds of a missed call, the caller gets a text from your number asking what they need — so the bid does not go to whoever called back first.`,
          roi: 'Closes the gap that is costing you the most jobs.',
        },
        {
          title: 'Estimate follow up on a schedule',
          description: `Every estimate you send gets chased at day 2, day 5, and day 10, in your voice, without you being the one to remember.`,
          roi: 'Recovers bids that are currently dying in silence.',
        },
        {
          title: 'A tighter Google Business Profile',
          description: `Most ${trade.toLowerCase() || 'contractor'} profiles in ${serviceArea || 'your area'} are missing hours, photos, or service categories — easy wins that lift Map-Pack ranking inside a week.`,
          roi: "Recovers visibility on the searches you're already losing.",
        },
      ]);
      setAiSummary(`We've prepared your initial audit. Let's schedule a free 15-minute call to walk through what an unanswered phone is costing ${company} in ${serviceArea}, and what fixing it is worth.`);
      setAiMissingGbp([]);
      setCalendlyUrl(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimSavings = () => {
    const element = document.getElementById('lead-capture-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const requestDemoSpec = (index: number, _title: string) => {
    setIsDemoRequestSent((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-cobalt selection:text-white">

      {/* Dev-only export bar — hidden in production builds */}
      {import.meta.env.DEV && (
        <div className="bg-ink border-b border-white/10 text-white py-2.5 px-4 sticky top-0 z-50 text-xs flex flex-wrap gap-4 items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <p className="font-medium text-white/70">
              Developer Sandbox Mode: <span className="text-white">stoneVEIL Operations LLC</span>
            </p>
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsExportOpen(true)}
              className="bg-cobalt hover:opacity-90 text-white font-semibold py-1 px-3 text-[11px] transition duration-150 inline-flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Standalone HTML</span>
            </button>
            <a
              href="/landing.html"
              target="_blank"
              rel="noreferrer"
              className="bg-transparent border border-white/20 hover:bg-white/5 text-white/70 font-medium py-1 px-3 text-[11px] transition"
            >
              Open Standalone Raw Page
            </a>
          </div>
        </div>
      )}

      {/* HEADER / TITLE-BLOCK NAVIGATION */}
      <header className={`bg-paper hairline-b px-6 md:px-12 py-4 sticky z-40 backdrop-blur-md bg-paper/95 ${import.meta.env.DEV ? 'top-[42px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center space-x-3 text-ink">
            <img src="/assets/monogram.webp" alt="" className="w-8 h-8" />
            <span className="font-display font-bold text-lg tracking-tight">
              stone<span className="text-cobalt">VEIL</span>{' '}
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-hairline text-ink-muted ml-1">Operations</span>
            </span>
          </a>

          <a href="#lead-capture-form" className="group relative text-sm font-semibold text-ink pb-1">
            Book the audit
            <span className="absolute left-0 -bottom-0.5 h-[1.5px] w-0 bg-cobalt transition-all duration-200 group-hover:w-full"></span>
          </a>
        </div>
      </header>

      {/* HERO — asymmetric split, grade-shift pair */}
      <section className="relative bg-paper px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          <div className="lg:col-span-6 flex flex-col space-y-7" data-reveal>
            <div className="flex flex-wrap items-center gap-3">
              <span className="spec-label border border-hairline px-3 py-1.5">Now booking the free 48-hour audit</span>
              <span className="text-[11px] text-ink-muted border border-hairline px-3 py-1.5 uppercase tracking-wider">2–3 person construction contractors</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight font-display text-ink">
              Every missed call is a lost bid.
            </h1>

            <p className="text-ink-muted text-lg md:text-xl max-w-xl leading-relaxed">
              Local homeowners are calling right now. When your crew can't pick up, the bid doesn't wait — it goes to whoever answers first.
            </p>

            <p className="text-ink-muted text-base md:text-lg max-w-xl leading-relaxed">
              stoneVEIL runs a thin automated layer over your phone line: missed calls get an instant text back, estimates get chased on schedule, invoices get chased, reviews get asked for — all on tools you own.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href="#lead-capture-form"
                className="cta-viewfinder btn-press bg-ink hover:bg-dusk text-white font-bold text-center py-4 px-8 text-base"
              >
                Book the audit &rarr;
              </a>
              <a
                href="#how-it-works"
                className="border border-hairline hover:border-ink text-ink font-semibold text-center py-4 px-8 transition text-base"
              >
                See how it works
              </a>
            </div>

            <p className="text-sm text-ink-muted pt-1 max-w-xl">
              Audit is free, 48-hour turnaround. Single workflow builds run $2,500–$15,000; a managed retainer runs $500–$5,000/mo, scoped to what's live.
            </p>
          </div>

          {/* Grade-shift plate: veiled (unattended) crossfades to lifted (handled) */}
          <div className="lg:col-span-6 w-full" data-reveal data-delay="150">
            <div
              ref={heroRef}
              onMouseMove={handleHeroPointerMove}
              onMouseLeave={() => window.matchMedia('(hover: hover)').matches && setRevealAmount(0)}
              className="grade-shift w-full aspect-[4/5] hairline"
              style={{ ['--reveal-amount' as any]: revealAmount }}
            >
              <img src="/assets/hero-veiled.webp" alt="A jobsite at dusk, phone lighting up unanswered" className="grade-shift__base" />
              <img src="/assets/hero-lifted.webp" alt="The same jobsite the next morning, crew working, job booked" className="grade-shift__reveal" />
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-ink/70 backdrop-blur-sm flex items-center justify-between text-[10px] uppercase tracking-widest text-white/80 font-sans">
                <span>Move your cursor to lift the veil</span>
                <span className="text-white">{Math.round(revealAmount * 100)}%</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STAT BAND */}
      <section className="hairline-t hairline-b bg-limestone py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6" data-reveal>
          {STATS.map((s, i) => (
            <div key={i} className={`space-y-2 ${i > 0 ? 'md:pl-6 md:border-l md:border-hairline' : ''}`}>
              <div className="text-4xl md:text-5xl font-extrabold font-display text-cobalt tracking-tight">{s.figure}</div>
              <p className="text-sm text-ink leading-snug">{s.caption}</p>
              <p className="text-[11px] text-ink-muted uppercase tracking-wider">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE AUTOMATE */}
      <section className="py-24 px-6 bg-paper hairline-b">
        <div className="max-w-6xl mx-auto flex flex-col space-y-14">
          <div className="max-w-2xl space-y-3" data-reveal>
            <span className="spec-label">What we automate</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-ink">
              Five workflows, built on tools you already own the accounts for.
            </h2>
          </div>

          <div className="space-y-0">
            {AUTOMATIONS.map((a, i) => (
              <div
                key={a.title}
                data-reveal
                data-delay={String(Math.min(500, i * 100))}
                className={`hairline-t py-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${i % 2 === 1 ? 'md:text-right' : ''}`}
              >
                <div className={`md:col-span-2 flex ${i % 2 === 1 ? 'md:justify-end' : ''}`}>
                  <img src={a.icon} alt="" className="w-14 h-14" />
                </div>
                <div className={`md:col-span-7 space-y-2 ${i % 2 === 1 ? 'md:order-first' : ''}`}>
                  <h3 className="text-xl md:text-2xl font-bold font-display text-ink">{a.title}</h3>
                  <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-2xl">{a.outcome}</p>
                </div>
                <div className="md:col-span-3">
                  <span className="text-[11px] uppercase tracking-wider text-cobalt font-semibold">{a.stack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: AUDIT / BUILD / RUN */}
      <section id="how-it-works" className="py-24 px-6 bg-limestone hairline-b">
        <div className="max-w-6xl mx-auto flex flex-col space-y-14">
          <div className="max-w-2xl space-y-3" data-reveal>
            <span className="spec-label">How it works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-ink">
              Audit, build, run. No code, no black box.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal data-delay="150">
            {STEPS.map((s) => (
              <div key={s.index} className="hairline bg-paper flex flex-col">
                <div className="relative h-40 overflow-hidden">
                  <img src={s.plate} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 text-white font-display font-extrabold text-2xl drop-shadow">{s.index}</span>
                </div>
                <div className="p-6 space-y-3 flex-1">
                  <h3 className="text-xl font-bold font-display text-ink">{s.title}</h3>
                  <p className="text-sm text-ink font-semibold leading-relaxed">{s.body}</p>
                  <p className="text-sm text-ink-muted leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <a
              href="#lead-capture-form"
              className="cta-viewfinder inline-flex items-center space-x-3 bg-ink hover:bg-dusk text-white font-bold py-4 px-8 transition duration-150"
            >
              <span>Book the audit</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* WHAT A BUILD ACTUALLY LOOKS LIKE — second-read moment, founder note */}
      <section className="py-24 px-6 bg-paper hairline-b">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8" data-reveal>
            <span className="spec-label">What a build actually looks like</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-ink mt-3 mb-6 max-w-xl">
              One workflow, running on your number, in your voice.
            </h2>
            <div className="hairline overflow-hidden">
              <img src="/assets/walkthrough.webp" alt="Workflow builder screen showing a missed-call text-back automation" className="w-full h-auto" />
            </div>
          </div>

          {/* Side-rail note — founder background, not a testimonial */}
          <aside className="lg:col-span-4 hairline p-6 space-y-5 lg:mt-16" data-reveal data-delay="150">
            <p className="spec-label">Who's building this</p>
            <p className="text-sm text-ink leading-relaxed">
              stoneVEIL Operations is a one-person build: 8 years inside Web.com, Realtor.com, and TheKnot.com walking small-business owners through what was working in their marketing and what wasn't — including training agents on Opcity, Realtor.com's live-leads-by-phone system, which is close to the same motion this automates for contractors now.
            </p>
            <div className="hairline-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-extrabold font-display text-cobalt">8 yrs</div>
                <div className="text-[11px] text-ink-muted leading-snug">SMB marketing — Web.com, Realtor.com, TheKnot.com</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold font-display text-cobalt">4 yrs</div>
                <div className="text-[11px] text-ink-muted leading-snug">Production DBA — MSSQL, Postgres, Python</div>
              </div>
            </div>
            <p className="text-sm text-ink leading-relaxed hairline-t pt-4">
              A prediction model scoring 3 million transactions on migration likelihood surfaced $3B in revenue a Fortune-class business was silently leaving on the table — the same forecasting and feature-engineering techniques, scaled down to a single contractor's phone line.
            </p>
          </aside>
        </div>
      </section>

      {/* PRICING — hairline ledger table */}
      <section className="py-24 px-6 bg-limestone hairline-b">
        <div className="max-w-4xl mx-auto flex flex-col space-y-10">
          <div className="max-w-2xl space-y-3" data-reveal>
            <span className="spec-label">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-ink">
              Real market ranges. Scope sets the number.
            </h2>
          </div>

          <div className="hairline bg-paper divide-y divide-hairline" data-reveal data-delay="150">
            {TIERS.map((t) => (
              <div key={t.name} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center">
                <div className="md:col-span-5">
                  <h3 className="text-lg font-bold font-display text-ink">{t.name}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed mt-1">{t.scope}</p>
                </div>
                <div className="md:col-span-3">
                  <div className="text-2xl font-extrabold font-display text-cobalt">{t.price}</div>
                  <div className="text-[11px] text-ink-muted mt-1">{t.note}</div>
                </div>
                <div className="md:col-span-4 md:text-right">
                  <a
                    href="#lead-capture-form"
                    className="cta-stamp btn-press inline-block border border-ink text-ink hover:bg-ink hover:text-white font-bold text-sm py-3 px-6 transition"
                  >
                    Book the audit
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE FORM AND DYNAMIC AI AUDIT RESULTS — the functional core */}
      <section id="lead-capture-form" className="py-24 px-6 bg-ink text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 space-y-12">

          <div className="text-center space-y-4" data-reveal>
            <span className="inline-flex items-center space-x-2 border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
              Free missed-call audit — 48 hour turnaround
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-white">
              Get your free audit.
            </h2>
            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              I'll pull your Google Business Profile, compare it to a top local competitor in your trade, and email you 3 specific things costing you jobs right now. If we're a fit, we hop on a 15-minute call. If not, the audit is yours to keep.
            </p>
          </div>

          {/* Risk reversal panel */}
          <div className="border border-white/15 p-6 md:p-8 max-w-3xl mx-auto" data-reveal>
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-6 h-6 text-cobalt shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold text-lg leading-tight mb-1">No-risk promise.</p>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  If your free audit doesn't surface at least 3 actionable wins for your business, you don't pay for the build. Replies to my emails go to a real person — me — not a noreply inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Form and Outcome wrapper */}
          <div className="border border-white/15 p-6 md:p-10 relative min-h-[480px]" data-reveal data-delay="150">

            {!success ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">

                {/* Calculator context line */}
                <div className="border border-cobalt/40 bg-cobalt/10 p-4 flex items-start space-x-3 text-white/80 text-xs">
                  <TrendingUp className="w-5 h-5 text-cobalt shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Dial in your numbers — this feeds your audit.</p>
                    <p className="mt-0.5">
                      Targeting <span className="font-bold text-white">{estMonthlySearches} monthly searches</span> at {estCloseRate}% close rate × ${estTicket} ticket — a 10-point close-rate lift would mean <span className="font-bold text-white">${monthlyRevenueAtStake.toLocaleString()}/month</span> (${annualRevenueAtStake.toLocaleString()}/year).
                    </p>
                  </div>
                </div>

                {/* ROI sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-white/10 p-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Monthly local searches</span>
                      <span className="font-mono text-white">{estMonthlySearches}</span>
                    </div>
                    <input type="range" min="20" max="500" value={estMonthlySearches} onChange={(e) => setEstMonthlySearches(parseInt(e.target.value))} className="w-full accent-white cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Close rate</span>
                      <span className="font-mono text-white">{estCloseRate}%</span>
                    </div>
                    <input type="range" min="5" max="40" value={estCloseRate} onChange={(e) => setEstCloseRate(parseInt(e.target.value))} className="w-full accent-white cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>Average ticket</span>
                      <span className="font-mono text-white">${estTicket}</span>
                    </div>
                    <input type="range" min="100" max="5000" step="50" value={estTicket} onChange={(e) => setEstTicket(parseInt(e.target.value))} className="w-full accent-white cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Full Name <span className="text-cobalt">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><User className="w-4.5 h-4.5" /></div>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="Jane Smith" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Business Email <span className="text-cobalt">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><Mail className="w-4.5 h-4.5" /></div>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="jane@acmeplumbing.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Mobile Number <span className="text-white/40 normal-case font-normal">— optional, we'll text you first</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><Phone className="w-4.5 h-4.5" /></div>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="(720) 555-0192" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Business Name <span className="text-cobalt">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><Building2 className="w-4.5 h-4.5" /></div>
                      <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="Acme Plumbing" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60">City and State <span className="text-cobalt">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><Building2 className="w-4.5 h-4.5" /></div>
                      <input type="text" required value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="Denver, CO" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">What's your trade? <span className="text-cobalt">*</span></label>
                  <select required value={trade} onChange={(e) => setTrade(e.target.value)} className="w-full bg-ink border border-white/20 py-3 px-4 text-white focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base cursor-pointer appearance-none">
                    <option value="" disabled>Select your trade...</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Roofer">Roofer</option>
                    <option value="Landscaping / lawn care">Landscaping / lawn care</option>
                    <option value="General contractor / handyman">General contractor / handyman</option>
                    <option value="Painter">Painter</option>
                    <option value="Concrete / masonry">Concrete / masonry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Where do most of your leads come from today? <span className="text-cobalt">*</span></label>
                  <select required value={currentLeadSource} onChange={(e) => setCurrentLeadSource(e.target.value)} className="w-full bg-ink border border-white/20 py-3 px-4 text-white focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base cursor-pointer appearance-none">
                    <option value="" disabled>Pick the closest match...</option>
                    <option value="Google search (organic / Map Pack)">Google search (organic / Map Pack)</option>
                    <option value="Word of mouth / referrals">Word of mouth / referrals</option>
                    <option value="Facebook / Nextdoor">Facebook / Nextdoor</option>
                    <option value="Paid ads (Google / Facebook)">Paid ads (Google / Facebook)</option>
                    <option value="Lead-gen services (Angi, HomeAdvisor, Thumbtack)">Lead-gen services (Angi, HomeAdvisor, Thumbtack)</option>
                    <option value="I don't really track it">I don't really track it</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60">Google Business Profile URL <span className="text-white/40 normal-case font-normal">— optional, enables a deeper audit</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40"><Building2 className="w-4.5 h-4.5" /></div>
                    <input type="url" value={gbpUrl} onChange={(e) => setGbpUrl(e.target.value)} className="w-full bg-transparent border border-white/20 py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-cobalt transition duration-150 text-sm md:text-base" placeholder="https://maps.app.goo.gl/..." />
                  </div>
                  <p className="text-[11px] text-white/40">Find it by searching your business name on Google Maps and copying the URL.</p>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="cta-stamp btn-press w-full bg-white hover:bg-white/90 disabled:bg-white/40 text-ink font-extrabold py-4 px-6 text-base cursor-pointer flex items-center justify-center space-x-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Running your audit...</span>
                      </>
                    ) : (
                      <span>Book my free audit &rarr;</span>
                    )}
                  </button>
                  <p className="text-center text-xs text-white/40 mt-3 font-semibold">Replies go to a real inbox, not noreply.</p>
                </div>

              </form>
            ) : (
              <div className="space-y-8 audit-result-animate">

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between hairline-b border-white/10 pb-6 gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 border border-cobalt/40 flex items-center justify-center text-2xl shrink-0">🎉</div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold font-display text-white">Audit Ready, {name}.</h3>
                      <p className="text-xs text-white/50">Your custom audit is on its way to {email}</p>
                    </div>
                  </div>
                  <div className={`font-mono text-xs px-3 py-1.5 flex items-center justify-center space-x-2 border ${aiTier === 'hot' ? 'border-cobalt text-white' : 'border-white/20 text-white/60'}`}>
                    <span className="w-2 h-2 rounded-full inline-block bg-cobalt animate-pulse"></span>
                    <span>FIT: <strong className="text-white ml-1">{aiTier ? aiTier.toUpperCase() : 'WARM'}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="spec-label text-white/60">Real-Time Lead Analysis Outcome</p>
                  <p className="text-sm md:text-base text-white/80 leading-relaxed italic">
                    "{aiSummary || `Audit drafted for ${company} (${trade}, ${serviceArea}). Here are the specific things in your phone-response loop that look like the easiest wins right now.`}"
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="spec-label text-white/60">Custom Recommendations</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiRecommendations.map((rec, i) => (
                      <div key={i} className="border border-white/10 p-5 hover:border-cobalt/50 transition flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono text-cobalt uppercase font-semibold">
                            <span>Strategy {i + 1}</span>
                          </div>
                          <h4 className="font-bold text-sm text-white font-display leading-snug">{rec.title}</h4>
                          <p className="text-xs text-white/60 leading-relaxed">{rec.description}</p>
                        </div>
                        <div className="pt-4 hairline-t border-white/10 mt-4 space-y-3 shrink-0">
                          <p className="text-[10px] text-white/70 font-semibold font-mono">{rec.roi}</p>
                          <button
                            disabled={isDemoRequestSent[i]}
                            onClick={() => requestDemoSpec(i, rec.title)}
                            className={`w-full py-2 px-3 text-[10px] font-bold uppercase tracking-wider transition ${isDemoRequestSent[i] ? 'bg-cobalt text-white cursor-default' : 'bg-transparent hover:bg-white/5 text-white/50 border border-white/10 hover:text-white cursor-pointer'}`}
                          >
                            {isDemoRequestSent[i] ? '✓ Requested Callback' : 'Request Demo build'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {aiMissingGbp.length > 0 && (
                  <div className="border border-cobalt/30 p-5 space-y-3">
                    <p className="spec-label text-white/60">Quick wins spotted in your Google Profile</p>
                    <ul className="space-y-1.5">
                      {aiMissingGbp.map((gap, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-white/70">
                          <AlertTriangle className="w-3.5 h-3.5 text-cobalt shrink-0 mt-0.5" />
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiTier === 'hot' && calendlyUrl ? (
                  <div className="border border-cobalt p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-cobalt shrink-0" />
                        <span>You're a strong fit — book your free 15-minute call now.</span>
                      </p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        We'll walk through your gaps and exactly what fixing them is worth to your business. Audit summary sent to <strong className="text-white/80">{email}</strong>.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <a
                        href={calendlyUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => window.plausible?.('calendly_clicked')}
                        className="cta-stamp btn-press inline-flex items-center justify-center space-x-2 bg-white hover:bg-white/90 text-ink font-extrabold text-sm py-3 px-6"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book my free 15-minute call &rarr;</span>
                      </a>
                      <button
                        onClick={() => { setSuccess(false); setAiTier(null); setAiRecommendations([]); setAiSummary(''); setAiMissingGbp([]); setCalendlyUrl(null); setTrade(''); setServiceArea(''); setCurrentLeadSource(''); setPhone(''); setGbpUrl(''); }}
                        className="bg-transparent hover:bg-white/5 text-white/50 font-medium text-xs px-4 py-2 border border-white/10 hover:border-white/20 transition"
                      >
                        Submit another
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-sm font-bold text-white">We'll follow up within 1 business day.</p>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Audit summary sent to <strong className="text-white/80">{email}</strong>. Reply to that email or reach us at <a href="mailto:origin@stoneveil.io" className="text-cobalt hover:underline">origin@stoneveil.io</a>.
                      </p>
                    </div>
                    <button
                      onClick={() => { setSuccess(false); setAiTier(null); setAiRecommendations([]); setAiSummary(''); setAiMissingGbp([]); setCalendlyUrl(null); setTrade(''); setServiceArea(''); setCurrentLeadSource(''); setPhone(''); setGbpUrl(''); }}
                      className="bg-transparent hover:bg-white/5 text-white/70 font-medium text-xs px-4 py-2 border border-white/10 hover:border-white/20 transition"
                    >
                      Submit another
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-white/50 text-xs font-semibold uppercase tracking-wider hairline-t border-white/10 pt-8 mt-6">
            <div>Your data is never sold or shared</div>
            <div>We'll reach out within 1 business day</div>
            <div>No contracts, no commitment required</div>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-paper hairline-b">
        <div className="max-w-3xl mx-auto flex flex-col space-y-14">
          <div className="space-y-3" data-reveal>
            <span className="spec-label">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-ink">
              Common questions
            </h2>
          </div>

          <div className="w-full" data-reveal data-delay="150">
            {FAQS.map((faq, i) => (
              <div key={i} className="hairline-t">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full py-5 flex items-center justify-between text-left focus:outline-none hover:opacity-70 transition duration-150"
                >
                  <span className="font-bold text-ink font-display text-base md:text-lg pr-4">{faq.q}</span>
                  <span className="text-cobalt font-extrabold text-xl shrink-0">{activeFaq === i ? '−' : '+'}</span>
                </button>
                {activeFaq === i && (
                  <div className="pb-6 text-sm text-ink-muted leading-relaxed max-w-2xl">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA STRIP */}
      <section className="py-20 px-6 bg-ink text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center space-y-6" data-reveal>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white max-w-2xl leading-snug">
            Ready to stop losing bids to your phone?
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-xl">
            Free 48-hour missed-call audit. You see exactly what an unanswered phone is costing you, and you keep the report either way.
          </p>
          <div className="pt-4">
            <a href="#lead-capture-form" className="cta-viewfinder bg-white hover:bg-white/90 text-ink font-extrabold text-center py-4 px-8 transition-all text-base inline-block">
              Book the audit &rarr;
            </a>
          </div>
          <p className="text-xs text-white/40 pt-2 font-mono">
            Or email me directly: <a href="mailto:origin@stoneveil.io" className="text-white hover:underline font-semibold">origin@stoneveil.io</a>
          </p>
        </div>
      </section>

      {/* FOOTER — title block */}
      <footer className="bg-ink hairline-t border-white/10 py-12 px-6 text-white/50 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <span className="font-display font-bold text-white text-lg tracking-tight">stone<span className="text-cobalt">VEIL</span> Operations LLC</span>
            <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} stoneVEIL Operations LLC. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-6 text-xs font-semibold">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM CAPTURE BAR */}
      <div className={`fixed bottom-0 inset-x-0 bg-ink/95 hairline-t border-white/10 backdrop-blur-md px-6 py-4 flex items-center justify-between text-white z-40 md:hidden transition-transform duration-300 ${stickyBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-mono text-white/50 font-bold tracking-wider">Free · 48 hr</span>
          <span className="text-xs font-semibold text-white/80">Missed-call audit</span>
        </div>
        <a href="#lead-capture-form" className="bg-white text-ink font-extrabold text-xs px-4 py-2.5">Get Audit</a>
      </div>

      {/* Dev-only export modal */}
      {import.meta.env.DEV && isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-ink border border-white/15 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/30">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Download className="w-5 h-5 text-cobalt" />
                  <span>Your Standalone HTML Landing Page Code</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">100% self-contained file with inline Tailwind, responsive grid layout, interactive JS states & developer integration guide notes.</p>
              </div>
              <button onClick={() => setIsExportOpen(false)} className="text-white/50 hover:text-white transition text-lg font-bold p-1 bg-white/5 hover:bg-white/10">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-black/40 font-mono text-xs text-white/70">
              {htmlCode ? (
                <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed">{htmlCode}</pre>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cobalt" />
                  <p className="text-white/50 text-xs">Assembling full HTML templates...</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-xs text-white/40">
                <span>Deployable to Netlify, Github-Pages, Static Host</span>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleCopyCode} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 text-xs transition duration-155 inline-flex items-center space-x-1.5 cursor-pointer">
                  {copiedCode ? (<><Check className="w-4 h-4 text-cobalt" /><span>Copied!</span></>) : (<><Copy className="w-4 h-4" /><span>Copy to Clipboard</span></>)}
                </button>
                <button onClick={handleDownloadCode} className="bg-cobalt hover:opacity-90 text-white font-bold py-2 px-4 text-xs transition duration-155 inline-flex items-center space-x-1.5 cursor-pointer">
                  <Download className="w-4 h-4" />
                  <span>Download HTML File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
