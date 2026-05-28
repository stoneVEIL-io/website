import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Info, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Download,
  Flame,
  Clock,
  Briefcase,
  Layers,
  ArrowRightLeft,
  ChevronLeft
} from 'lucide-react';

export default function App() {
  // Navigation & Interactive States
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Standalone Code Export Modal
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // ROI Calculator inputs — leads-won model
  const [estMonthlySearches, setEstMonthlySearches] = useState<number>(120);
  const [estCloseRate, setEstCloseRate] = useState<number>(15); // percent
  const [estTicket, setEstTicket] = useState<number>(450); // average ticket $

  // A 10-percentage-point lift in close rate is the typical Stoneveil outcome —
  // honest and defensible. Revenue at stake = searches × 10pp × ticket.
  const currentMonthlyRevenue = Math.round(estMonthlySearches * (estCloseRate / 100) * estTicket);
  const monthlyRevenueAtStake = Math.round(estMonthlySearches * 0.10 * estTicket);
  const annualRevenueAtStake = monthlyRevenueAtStake * 12;
  const monthlyJobsAtStake = Math.round(estMonthlySearches * 0.10);

  // Lead Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [trade, setTrade] = useState('');
  const [currentLeadSource, setCurrentLeadSource] = useState('');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiScore, setAiScore] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isDemoRequestSent, setIsDemoRequestSent] = useState<Record<number, boolean>>({});

  // Mobile Sticky bottom bar visible on scroll
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  useEffect(() => {
    // Fetch and load standalone landing page source code for the export utility
    fetch('/landing.html')
      .then(r => r.text())
      .then(text => setHtmlCode(text))
      .catch(err => {
        console.warn("Failed to load local HTML copy for developer view", err);
      });

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      setStickyBarVisible(scrollPercent > 30 && window.innerWidth < 768);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          company,
          trade,
          serviceArea,
          currentLeadSource,
          estMonthlySearches,
          estCloseRate,
          estTicket,
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setAiScore(data.score || "HIGH");
        setAiRecommendations(data.recommendations || []);
        setAiSummary(data.summary || "");
      } else {
        throw new Error(data.error || "Internal server error submitting lead information");
      }
    } catch (err) {
      console.warn("API not reachable; showing local fallback audit for sandbox preview:", err);
      setSuccess(true);
      setAiScore("HIGH");
      setAiRecommendations([
        {
          title: `Fix your Google Business Profile basics for ${company}`,
          description: `Most ${trade.toLowerCase()} profiles in ${serviceArea} are missing hours, photos, or service categories — easy wins that lift Map-Pack ranking inside a week.`,
          roi: "Recovers visibility on the searches you're already losing."
        },
        {
          title: "Instant text-back when you can't pick up",
          description: "Automated SMS reply within 60 seconds of any missed call, with a link to a quote form. Cuts the leak between phone ringing and competitor calling.",
          roi: "Closes the gap that's costing you the most jobs."
        },
        {
          title: "After-hours coverage that books while you sleep",
          description: "Weekend and after-5pm inquiries get acknowledged immediately and qualified into your inbox by morning — no more Monday-morning ghosting.",
          roi: "Captures the leads currently dying in voicemail."
        }
      ]);
      setAiSummary(`Sandbox preview — these are placeholder recommendations. Set GEMINI_API_KEY on the server to run the live Google Profile audit for ${company} in ${serviceArea}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimSavings = () => {
    const element = document.getElementById("lead-capture-form");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const requestDemoSpec = (index: number, title: string) => {
    setIsDemoRequestSent(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      // Revert after showing professional feedback
    }, 4000);
  };

  return (
    <div className="bg-white text-slate-800 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* EXPORT STANDALONE BAR (Top Level Developer Help HUD) */}
      <div className="bg-slate-900 border-b border-white/10 text-white py-2.5 px-4 sticky top-0 z-50 text-xs flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <p className="font-medium text-slate-300">
            Developer Sandbox Mode: <span className="text-white">stoneVEIL Operations LLC</span> Lead Capture App Applet
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded text-[11px] transition duration-150 inline-flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Standalone HTML</span>
          </button>
          <a 
            href="/landing.html" 
            target="_blank" 
            rel="noreferrer"
            className="bg-transparent border border-white/20 hover:bg-white/5 text-slate-300 font-medium py-1 px-3 rounded text-[11px] transition"
          >
            Open Standalone Raw Page
          </a>
        </div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="bg-brand-navy p-5 px-6 md:px-12 border-b border-white/5 sticky top-[42px] z-40 bg-[#0F1929]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center space-x-3 text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              stone<span className="text-indigo-500">VEIL</span> <span className="text-xs uppercase font-mono px-1.5 py-0.5 bg-white/5 rounded border border-white/10 ml-2 text-slate-400">Operations</span>
            </span>
          </a>
          
          <a 
            href="#lead-capture-form" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm md:text-base py-2.5 px-5 rounded-lg transition-all duration-200 shadow-md hover:shadow-indigo-500/10"
          >
            Get my free audit
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-[#0F1929] text-white pt-16 pb-24 md:pt-24 md:pb-32 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Hero Copy */}
          <div className="lg:col-span-7 flex flex-col space-y-6 md:space-y-8 items-start">
            <span className="inline-flex items-center space-x-2 bg-white/5 border border-white/15 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block animate-ping"></span>
              <span>Built for 2–5 Person Trades — First-Cohort Pricing</span>
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight font-display text-white">
              You're not getting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">the jobs you should be</span>.
            </h1>
            
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed">
              Local homeowners are searching for trades like yours right now — and more than half are picking your competitor because of a slow website, a missed text, or a better-looking Google profile.
            </p>

            <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
              Stoneveil builds 2–5 person contractors a Google-Profile-powered website that wins more of those jobs, then automates the lead-response loop where you used to lose them.
            </p>
            
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4 pt-2">
              <a 
                href="#lead-capture-form" 
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-center py-4 px-8 rounded-lg shadow-xl shadow-amber-500/15 transition-all text-base hover:-translate-y-0.5"
              >
                Get my free Google Profile audit &rarr;
              </a>
              <a 
                href="#how-we-work-section" 
                className="border border-white/20 hover:bg-white/5 text-white font-semibold text-center py-4 px-8 rounded-lg transition text-base"
              >
                See How It Works
              </a>
            </div>
            
            <p className="text-sm text-slate-400 pt-1 max-w-2xl">
              Audit is free. Websites start at $3K–$5K with a $300/mo automation retainer. First-cohort pricing, capped at 5 contractors.
            </p>

            {/* Founder Credentials */}
            <div className="w-full pt-6 border-t border-white/10 grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl md:text-3xl font-extrabold font-display text-white">8 yrs</div>
                <div className="text-xs md:text-sm text-slate-400">Inside Web.com, Realtor.com, TheKnot.com helping SMB owners with marketing, websites, and lead flow.</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">$3B</div>
                <div className="text-xs md:text-sm text-slate-400">Retention revenue surfaced from a 3M-transaction prediction model.</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold font-display text-indigo-400">4 yrs</div>
                <div className="text-xs md:text-sm text-slate-400">Production DBA — MSSQL, Postgres, Python automation.</div>
              </div>
            </div>
          </div>
          
          {/* Animated SVG/CSS Graphic */}
          <div className="lg:col-span-5 w-full flex justify-center relative">
            <div className="w-full max-w-md aspect-square bg-slate-900/80 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between relative shadow-2xl">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-slate-400 tracking-wider">PIPELINE MONITOR</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 block animate-ping"></span>
                    <span>ACTIVE STATE</span>
                  </span>
                </div>
                
                {/* Visual Chaos element */}
                <div className="relative flex-1 flex flex-col items-center justify-center">
                  
                  {/* Left elements: Chaos (emails, manual) */}
                  <div className="absolute left-2 top-10 space-y-3 opacity-40 hover:opacity-75 transition-opacity">
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded px-2.5 py-1 text-[10px] font-mono flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
                      <span>Lost CRM Leads</span>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 text-orange-200 rounded px-2.5 py-1 text-[10px] font-mono flex items-center space-x-1.5">
                      <span>Manual Invoice Copy</span>
                    </div>
                  </div>

                  {/* Center Module: The Engine */}
                  <div className="z-10 bg-slate-950/90 border border-indigo-500/30 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-indigo-500/20 shadow-2xl relative">
                    <div className="absolute -inset-2 rounded-full bg-indigo-500/10 animate-pulse"></div>
                    <Sparkles className="w-10 h-10 text-indigo-400 hover:scale-115 transition duration-300" />
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono mt-1 font-bold">stoneVEIL API</span>
                  </div>

                  {/* Right elements: Clarity */}
                  <div className="absolute right-2 bottom-10 space-y-3 opacity-90">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded px-2.5 py-1 text-[10px] font-mono flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sync Realized</span>
                    </div>
                    <div className="bg-indigo-500/15 border border-indigo-500/20 text-indigo-200 rounded px-2.5 py-1 text-[10px] font-mono flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                      <span>Follow-up Sent</span>
                    </div>
                  </div>

                  {/* Connecting lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 15 25 Q 40 30 50 45" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                      <path d="M 15 45 Q 35 48 50 50" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                      <path d="M 68 50 Q 80 52 88 38" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.8" fill="none" />
                      <path d="M 62 65 Q 75 75 88 78" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.8" fill="none" />
                    </svg>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>DISPATCH: <span className="text-emerald-400">OPERATIONAL</span></span>
                  <span>LATENCY: 0.1s</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HIGH CONVERTING ADDITION: INTERACTIVE ROI CALCULATOR */}
      <section className="py-20 px-6 bg-slate-900 text-white relative border-y border-white/5 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-amber-400 font-semibold tracking-wider text-xs uppercase font-mono">Leads Calculator</span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">How much revenue is going to your competitor?</h2>
            <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
              Most contractors don't know how much business they're leaving on the table from a slow website and a weak Google profile. Move the sliders to see — and what a typical Stoneveil lift would be worth to you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
            
            {/* Control Sliders */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
              
              {/* Slider 1: Monthly local searches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold tracking-wide text-slate-300 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Monthly local searches for your trade in your area:</span>
                  </label>
                  <span className="text-base font-extrabold font-mono text-white bg-indigo-500/20 px-3 py-1 rounded">
                    {estMonthlySearches}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={estMonthlySearches}
                  onChange={(e) => setEstMonthlySearches(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-550">
                  <span>20 searches</span>
                  <span>250</span>
                  <span>500+ searches</span>
                </div>
              </div>

              {/* Slider 2: Current close rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold tracking-wide text-slate-300 flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <span>Searchers who actually call & book you today:</span>
                  </label>
                  <span className="text-base font-extrabold font-mono text-white bg-indigo-500/20 px-3 py-1 rounded">
                    {estCloseRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={estCloseRate}
                  onChange={(e) => setEstCloseRate(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-550">
                  <span>5%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
              </div>

              {/* Slider 3: Average ticket */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold tracking-wide text-slate-300 flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-indigo-400" />
                    <span>Average ticket per job:</span>
                  </label>
                  <span className="text-base font-extrabold font-mono text-white bg-indigo-500/20 px-3 py-1 rounded">
                    ${estTicket}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={estTicket}
                  onChange={(e) => setEstTicket(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-550">
                  <span>$100</span>
                  <span>$2,500</span>
                  <span>$5,000+</span>
                </div>
              </div>

            </div>

            {/* Calculations Outcome Board */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-905 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-5">
                <span className="text-[11px] font-bold font-mono tracking-wider text-indigo-350 block uppercase">Revenue going to your competitor</span>

                <div className="space-y-1">
                  <p className="text-slate-400 text-sm font-medium">Left on the table each month:</p>
                  <p className="text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight flex items-baseline">
                    ${monthlyRevenueAtStake.toLocaleString()}
                    <span className="text-sm font-semibold text-slate-300 ml-2">/ month</span>
                  </p>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-slate-400 text-sm font-medium">Annual revenue from a 10-point close-rate lift:</p>
                  <p className="text-4xl md:text-5xl font-extrabold font-display text-emerald-400 tracking-tight flex items-baseline">
                    ${annualRevenueAtStake.toLocaleString()}
                    <span className="text-sm font-semibold text-slate-300 ml-2">/ year</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-white/15 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Current Monthly Revenue From Search</span>
                    <span className="text-white font-extrabold font-mono text-lg">${currentMonthlyRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Extra Jobs Per Month</span>
                    <span className="text-white font-extrabold font-mono text-lg">{monthlyJobsAtStake} jobs</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={claimSavings}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 px-6 rounded-lg text-sm md:text-base cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 inline-flex items-center justify-center space-x-2"
                >
                  <span>Show me what I'm missing →</span>
                </button>
                <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-450">
                  <span>🔒</span>
                  <span>Calculated values securely pre-fills in audit form below</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: PAIN AGITATION */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-150 relative">
        <div className="max-w-7xl mx-auto flex flex-col space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F1929] font-display">
              Sound familiar?
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              You started a trade business to do the work. Not to be the call-center, the marketer, and the after-hours responder all at once.
            </p>
          </div>

          {/* 6-Card Grid of Pain Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">

            {/* Card 1 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Phone rings while you're on a job</h3>
                <p className="text-sm text-slate-600 leading-relaxed">You can't stop in the middle of work to answer. The call goes to voicemail, and most homeowners just dial the next guy on the list.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Slow text-back loses the lead</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Replying within 5 minutes vs. an hour can mean the difference between a booked job and a homeowner who's already moved on.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Weak Google Profile</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Missing hours, old photos, thin reviews. You're invisible in the Map Pack while a competitor with a fuller profile wins every search.</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Reviews you never get around to asking for</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Happy customers don't think to leave one. Without a system to ask, your review count stays flat — and so does your Google ranking.</p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Radio silence after 5pm</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Saturday-morning emergency call goes nowhere until Monday. By then the homeowner's hired someone else and you'll never know they tried.</p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-xl hover:shadow-lg hover:border-indigo-500/20 transition duration-300 flex space-x-4 items-start">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 font-display text-base">Quotes that go out three days late</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Lead asks for pricing on a Tuesday. You finish the quote on Friday from the truck. They've already booked the other guy who got back to them that night.</p>
              </div>
            </div>

          </div>

          <div className="text-center pt-4">
            <p className="text-lg md:text-xl font-semibold text-[#0F1929] max-w-xl mx-auto italic font-display">
              "Every one of these is fixable in your first build. Most go live within 1–2 weeks."
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section id="how-we-work-section" className="py-24 px-6 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col space-y-16 items-center">
          
          <div className="text-center space-y-3 max-w-2xl bg-transparent">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F1929] font-display">
              From "where do I even start" to booked jobs in three steps
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              Three steps, designed to keep you on the job site. No code, no spreadsheets, no learning curve.
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 w-full relative">
            <div className="hidden lg:block absolute top-[2.5rem] left-[15%] right-[15%] h-0.5 border-t border-dashed border-slate-200"></div>

            {/* Step 1 */}
            <div className="bg-slate-50 lg:bg-transparent p-6 md:p-8 lg:p-0 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg relative z-10 font-mono">
                01
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display text-slate-950">1. Free Google Profile audit</h3>
                <span className="inline-block bg-indigo-55 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Time: 15 min call
                </span>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                  I pull your Google Business Profile, compare it side-by-side with a top local competitor in your trade, and send you 3 specific things costing you jobs right now. Yours to keep — even if we don't work together.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 lg:bg-transparent p-6 md:p-8 lg:p-0 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-lg relative z-10 font-mono">
                02
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display text-slate-950">2. Build & launch</h3>
                <span className="inline-block bg-indigo-55 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Time: 1–2 weeks
                </span>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                  Mobile-first website tailored to your trade, Google Profile fixes, and automated lead-response: instant text-back, after-hours coverage, missed-call follow-up. $3K–$5K, first-cohort pricing.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 lg:bg-transparent p-6 md:p-8 lg:p-0 rounded-2xl flex flex-col items-center text-center space-y-4 relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg relative z-10 font-mono">
                03
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display text-slate-950">3. Automated lead flow on retainer</h3>
                <span className="inline-block bg-emerald-55 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  $300/mo, cancel anytime
                </span>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                  The lead-response stays live and gets tuned monthly based on what's converting for you. You stop being the bottleneck — the leads land in your phone already qualified.
                </p>
              </div>
            </div>

          </div>

          <div className="pt-4">
            <a
              href="#lead-capture-form"
              className="inline-flex items-center space-x-3 bg-[#0F1929] hover:bg-[#1E293B] text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-150"
            >
              <span>Get my free Google Profile audit</span>
              <ArrowRight className="w-4 h-4 text-slate-350" />
            </a>
          </div>

        </div>
      </section>

      {/* SECTION 4: SOCIAL PROOF */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-150">
        <div className="max-w-7xl mx-auto flex flex-col space-y-16 items-center">
          
          <div className="text-center space-y-3 max-w-3xl">
            <span className="text-indigo-600 font-bold tracking-wider text-xs uppercase font-mono">Why Stoneveil</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F1929] font-display">
              Built by someone who's spent the last decade inside the small-business marketing problem.
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              Most "AI consultants" can pitch you a website. Almost none can audit your data layer, build the automation, AND train you on what good lead flow actually looks like. That's the combination Stoneveil is.
            </p>
          </div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            
            {/* Credential 1: SMB Marketing */}
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition">
              <div className="space-y-4">
                <span className="inline-block bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-2.5 py-1 rounded">
                  📞 SMB MARKETING — 8 YEARS
                </span>
                <p className="text-slate-650 text-sm leading-relaxed relative z-10">
                  I spent 8 years inside Web.com, Realtor.com, and TheKnot.com walking small business owners through exactly what was working in their marketing and what wasn't. At Realtor.com I trained agents on Opcity — the live-leads-by-phone system that's pretty much the same motion I'm building for your business now.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 mt-6 shrink-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Phone-by-phone with SMB owners</p>
                  <p className="text-xs text-slate-500">Web.com · Realtor.com · TheKnot.com</p>
                </div>
              </div>
            </div>

            {/* Credential 2: Production DBA */}
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition">
              <div className="space-y-4">
                <span className="inline-block bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold px-2.5 py-1 rounded">
                  💻 PRODUCTION DBA — 4 YEARS
                </span>
                <p className="text-slate-650 text-sm leading-relaxed relative z-10">
                  MSSQL and Postgres in production. Python automation. Translation: I write the code that runs at 2am while you sleep — automating what your spreadsheets are doing today. Most "AI consultants" can't write the database layer. I do.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 mt-6 shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Code that runs while you sleep</p>
                  <p className="text-xs text-slate-500">MSSQL · Postgres · Python</p>
                </div>
              </div>
            </div>

            {/* Credential 3: Prediction Model */}
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition">
              <div className="space-y-4">
                <span className="inline-block bg-teal-50 text-teal-700 font-mono text-[11px] font-bold px-2.5 py-1 rounded">
                  📊 PREDICTION MODEL — $3B SURFACED
                </span>
                <p className="text-slate-650 text-sm leading-relaxed relative z-10">
                  I built a model that scored 3 million transactions on migration likelihood. It surfaced $3 billion in revenue a Fortune-class business was silently leaving on the table. Cluster analysis, forecasting, feature engineering — same techniques scale down to small contractor jobs.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-100 mt-6 shrink-0">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">$3B revenue surfaced</p>
                  <p className="text-xs text-slate-500">Cluster analysis · Forecasting · Feature engineering</p>
                </div>
              </div>
            </div>

          </div>

          {/* Former employer trust strip */}
          <div className="w-full pt-8 border-t border-slate-200">
            <p className="text-center text-xs font-bold text-slate-400 font-mono tracking-widest uppercase mb-6">
              Where this founder learned the small-business marketing problem
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg border border-slate-200/60 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-lg font-bold tracking-tight text-slate-700 font-display">Web<span className="text-indigo-600">.com</span></span>
                <span className="text-[11px] text-slate-500 mt-1.5">SMB websites · SEO · SEM</span>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200/60 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-lg font-bold tracking-tight text-slate-700 font-display">Realtor<span className="text-rose-600">.com</span></span>
                <span className="text-[11px] text-slate-500 mt-1.5">Live-leads-by-phone (Opcity)</span>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200/60 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-lg font-bold tracking-tight text-slate-700 font-display">The<span className="text-emerald-600">Knot</span>.com</span>
                <span className="text-[11px] text-slate-500 mt-1.5">Vendor listings · conversion</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: LEAD CAPTURE FORM AND DYNAMIC AI AUDIT RESULTS */}
      <section id="lead-capture-form" className="py-24 px-6 bg-brand-navy bg-[#0F1929] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-[#0F1929] to-[#0F1929] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              📅 FREE GOOGLE PROFILE AUDIT — 15 MIN CALL IF WE'RE A FIT
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold font-display text-white">
              Get your free Google Profile audit.
            </h2>
            <p className="text-slate-350 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              I'll pull your Google Business Profile, compare it to a top local competitor in your trade, and email you 3 specific things costing you jobs right now. If we're a fit, we hop on a 15-minute call. If not, the audit is yours to keep — no follow-ups, no nonsense.
            </p>
          </div>

          {/* Risk reversal panel */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold text-lg leading-tight mb-1">
                  No-risk promise.
                </p>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  If your free audit doesn't surface at least 3 actionable wins for your business, you don't pay for the build. Replies to my emails go to a real person — me — not a noreply inbox.
                </p>
              </div>
            </div>
          </div>

          {/* Form and Outcome wrapper */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative min-h-[480px]">
            
            {!success ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">

                {/* Calculator context line */}
                <div className="bg-indigo-950/80 border border-indigo-500/30 p-4 rounded-lg flex items-start space-x-3 text-indigo-200 text-xs">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Your audit will use the leads-calculator inputs above.</p>
                    <p className="mt-0.5">
                      Targeting <span className="font-bold text-amber-400">{estMonthlySearches} monthly searches</span> at {estCloseRate}% close rate × ${estTicket} ticket — a 10-point close-rate lift would mean <span className="font-bold text-emerald-400">${monthlyRevenueAtStake.toLocaleString()}/month</span> (${annualRevenueAtStake.toLocaleString()}/year). Move the sliders above to adjust.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Full Name <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base"
                        placeholder="Jane Smith"
                      />
                    </div>
                  </div>

                  {/* Business Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Business Email <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                        <Mail className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base"
                        placeholder="jane@acmeplumbing.com"
                      />
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Business Name <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base"
                        placeholder="Acme Plumbing"
                      />
                    </div>
                  </div>

                  {/* City + State */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      City and State <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base"
                        placeholder="Denver, CO"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    What's your trade? <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base cursor-pointer appearance-none"
                  >
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

                {/* Current lead source */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Where do most of your leads come from today? <span className="text-amber-400">*</span>
                  </label>
                  <select
                    required
                    value={currentLeadSource}
                    onChange={(e) => setCurrentLeadSource(e.target.value)}
                    className="w-full bg-[#0F1929] border border-white/15 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-sm md:text-base cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Pick the closest match...</option>
                    <option value="Google search (organic / Map Pack)">Google search (organic / Map Pack)</option>
                    <option value="Word of mouth / referrals">Word of mouth / referrals</option>
                    <option value="Facebook / Nextdoor">Facebook / Nextdoor</option>
                    <option value="Paid ads (Google / Facebook)">Paid ads (Google / Facebook)</option>
                    <option value="Lead-gen services (Angi, HomeAdvisor, Thumbtack)">Lead-gen services (Angi, HomeAdvisor, Thumbtack)</option>
                    <option value="I don't really track it">I don't really track it</option>
                  </select>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-755 text-slate-950 font-extrabold py-4 px-6 rounded-lg text-base transform hover:-translate-y-0.5 active:translate-y-0 transition duration-150 shadow-xl shadow-amber-500/10 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                        <span>Generating Your Custom AI Recommendations...</span>
                      </>
                    ) : (
                      <>
                        <span>Book My Free Audit &rarr;</span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-center text-xs text-slate-400 mt-3 font-semibold">
                    First-cohort pricing — <span className="text-amber-400">capped at 5 contractors</span>. Replies go to a real inbox, not noreply.
                  </p>
                </div>

              </form>
            ) : (
              // EXTREMELY HIGH CONVERTING REAL-TIME AUDIT OUTCOME DISPLAY (No technical larping, clean literal labels)
              <div className="space-y-8 animate-fade-in">
                
                {/* Header state */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-white/10 pb-6 gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-400/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      🎉
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold font-display text-white">You're Booked, {name}!</h3>
                      <p className="text-xs text-slate-400">Scheduled: stoneVEIL Custom Discovery Strategy Team</p>
                    </div>
                  </div>
                  <div className="bg-indigo-550/15 border border-indigo-400/30 text-indigo-300 font-mono text-xs px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-450 inline-block animate-pulse"></span>
                    <span>AUTOMATION SCORE: <strong className="text-white ml-1">{aiScore} CANDIDATE</strong></span>
                  </div>
                </div>

                {/* Subtitle brief */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">Real-Time Lead Analysis Outcome</p>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed italic">
                    "{aiSummary || `Audit drafted for ${company} (${trade}, ${serviceArea}). Here are 3 specific things in your Google Profile and lead-response loop that look like the easiest wins right now.`}"
                  </p>
                </div>

                {/* recommendations matrix block */}
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Custom Recommendations List</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiRecommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-950/80 border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 uppercase font-semibold">
                            <span>Strategy {i+1}</span>
                            <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-[9px]">Priority</span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-white font-display leading-snug">
                            {rec.title}
                          </h4>
                          
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {rec.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 mt-4 space-y-3 shrink-0">
                          <p className="text-[10px] text-emerald-400 font-semibold font-mono">
                            ⚡ {rec.roi}
                          </p>
                          
                          <button 
                            disabled={isDemoRequestSent[i]}
                            onClick={() => requestDemoSpec(i, rec.title)}
                            className={`w-full py-2 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                              isDemoRequestSent[i] 
                                ? 'bg-emerald-500 text-white cursor-default' 
                                : 'bg-[#0F1929] hover:bg-slate-800 text-slate-350 border border-white/10 hover:text-white cursor-pointer'
                            }`}
                          >
                            {isDemoRequestSent[i] ? '✓ Requested Callback' : 'Request Demo build'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return or call again guide */}
                <div className="bg-[#0F1929]/80 border border-indigo-500/20 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-sm font-bold text-white flex items-center justify-center md:justify-start space-x-1.5">
                      <span>📆 Next Action item: Check your inbox</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      We've dispatched scheduling instructions to <strong className="text-slate-250">{email}</strong>. Reach us directly: <a href="mailto:origin@stoneveil.io" className="text-indigo-400 hover:underline">origin@stoneveil.io</a>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setTrade('');
                      setServiceArea('');
                      setCurrentLeadSource('');
                    }}
                    className="bg-transparent hover:bg-white/5 text-slate-300 font-medium text-xs px-4 py-2 border border-white/10 hover:border-white/20 rounded-lg transition"
                  >
                    Submit another lead
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Secure Trust bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-slate-400 text-xs font-semibold uppercase tracking-wider border-t border-white/10 pt-8 mt-6">
            <div className="flex items-center justify-center space-x-2">
              <span>🔒</span>
              <span>Your data is never sold or shared</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>📅</span>
              <span>We'll reach out within 1 business day</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>✅</span>
              <span>No contracts, no commitment required</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: FAQ (Handle Objections) */}
      <section className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col space-y-16 items-center">
          
          <div className="text-center space-y-3 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F1929] font-display">
              Common Questions
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              Straight answers to the questions contractors keep asking on the audit call.
            </p>
          </div>

          {/* FAQ Accordion container */}
          <div className="w-full space-y-4">

            {/* Q1 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">How long until my site is live?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 0 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 0 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p><strong>1–2 weeks from kick-off.</strong> The Google Profile audit happens on a free 15-minute call before that, so you see the work before you commit to anything.</p>
                  <p><a href="#lead-capture-form" className="text-indigo-600 hover:underline font-semibold">Book the 15-min audit call &rarr;</a></p>
                </div>
              )}
            </div>

            {/* Q2 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">Do I need to be tech-savvy?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 1 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 1 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p><strong>No.</strong> You keep doing the jobs. I handle the site, the Google Profile, and the lead-response automations. Replies to my emails come straight to me — not a noreply inbox.</p>
                </div>
              )}
            </div>

            {/* Q3 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">Will this work with the tools I already use?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 2 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 2 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p>Yes. If you already use Jobber, Housecall Pro, ServiceTitan, Google Calendar, QuickBooks, or just a phone and a notebook — we wire into it. Nobody's forcing you to switch software.</p>
                </div>
              )}
            </div>

            {/* Q4 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(3)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">How much does it cost?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 3 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 3 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p><strong>Audit: free.</strong> Build: $3K–$5K depending on scope. Retainer: $300/month for the automated lead response + monthly tuning. First-cohort pricing — capped at 5 contractors. You get a written quote before any work starts, and there are no surprise add-ons.</p>
                </div>
              )}
            </div>

            {/* Q5 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(4)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">What if I already have a website?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 4 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 4 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p>Most contractor sites I see are slow on a phone, missing from the Google Map Pack, or both. The audit shows you exactly where yours stands next to the local competitor winning your searches. <strong>If your site is already winning, I'll tell you — and you don't need me.</strong></p>
                </div>
              )}
            </div>

            {/* Q6 */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(5)}
                className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-slate-50 transition duration-150"
              >
                <span className="font-bold text-[#0F1929] font-display text-base md:text-lg">What's the ROI?</span>
                <span className="text-indigo-600 font-extrabold text-xl ml-4 shrink-0">
                  {activeFaq === 5 ? '−' : '+'}
                </span>
              </button>
              {activeFaq === 5 && (
                <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed space-y-2 border-t border-slate-50 pt-4 bg-slate-50/30">
                  <p>Honest answer: it depends on your search volume, close rate, and average ticket. The <a href="#lead-capture-form" className="text-indigo-600 hover:underline font-semibold">leads calculator</a> above is the same math I'll walk through on the audit call. If a 10-point close-rate lift is worth more to you than $300/month, the retainer pays for itself. If it's not, I'll tell you.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 7: FINAL CTA STRIP */}
      <section className="py-20 px-6 bg-brand-navy bg-[#0F1929] text-white text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white max-w-2xl leading-snug">
            Ready to start winning the jobs you're losing?
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-xl">
            Free 15-minute Google Profile audit. You see what your competitor is doing better, and you keep the report either way. No follow-ups, no nonsense.
          </p>

          <div className="pt-4">
            <a
              href="#lead-capture-form"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-center py-4 px-8 rounded-lg shadow-xl shadow-amber-500/20 transition-all text-base inline-block hover:-translate-y-0.5"
            >
              Get my free Google Profile audit &rarr;
            </a>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono">
            Or email me directly: <a href="mailto:origin@stoneveil.io" className="text-indigo-400 hover:underline font-semibold">origin@stoneveil.io</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F1929] border-t border-white/5 py-12 px-6 text-slate-400 text-center text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start space-y-2">
            <span className="font-display font-bold text-white text-lg tracking-tight">stone<span className="text-indigo-500">VEIL</span> Operations LLC</span>
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} stoneVEIL Operations LLC. All rights reserved.</p>
          </div>
          
          <div className="flex items-center space-x-6 text-xs font-semibold">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition inline-flex items-center space-x-1">
              <span>LinkedIn</span>
            </a>
          </div>

        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM CAPTURE BAR */}
      <div className={`fixed bottom-0 inset-x-0 bg-[#0F1929]/95 border-t border-white/10 backdrop-blur-md px-6 py-4 flex items-center justify-between text-white z-40 md:hidden transition-transform duration-300 ${stickyBarVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-mono text-amber-400 font-bold tracking-wider">Free · 15 min</span>
          <span className="text-xs font-semibold text-slate-350">Google Profile audit</span>
        </div>
        <a
          href="#lead-capture-form"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded shadow-lg"
        >
          Get Audit
        </a>
      </div>

      {/* EXPORT STANDALONE HTML LIGHTBOX MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative animate-scale-up">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Download className="w-5 h-5 text-indigo-400" />
                  <span>Your Standalone HTML Landing Page Code</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  100% self-contained file with inline Tailwind, responsive grid layout, interactive JS states & developer integration guide notes.
                </p>
              </div>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg font-bold p-1 bg-white/5 hover:bg-white/10 rounded"
              >
                ✕
              </button>
            </div>

            {/* Code Field */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0A0D14] font-mono text-xs text-slate-300">
              {htmlCode ? (
                <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed">
                  {htmlCode}
                </pre>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-slate-400 text-xs">Assembling full HTML templates...</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-450">
                <span>📁 Size: ~ 64KB</span>
                <span>•</span>
                <span>Deployable to Netlify, Github-Pages, Static Host</span>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleCopyCode}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded text-xs transition duration-155 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleDownloadCode}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded text-xs transition duration-155 inline-flex items-center space-x-1.5 cursor-pointer"
                >
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
