import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  Network, 
  Layers, 
  Upload, 
  Play, 
  Info,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Plot from "react-plotly.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const MetricCard = ({ label, value, sublabel, color = "blue" }: { label: string, value: string | number, sublabel?: string, color?: string }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all hover:scale-105">
    <span className="text-xs font-mono uppercase tracking-widest text-white/60 mb-2">{label}</span>
    <span className={cn("text-4xl font-bold mb-1", {
      "text-blue-400": color === "blue",
      "text-emerald-400": color === "emerald",
      "text-amber-400": color === "amber",
      "text-rose-400": color === "rose",
      "text-purple-400": color === "purple",
    })}>{value}</span>
    {sublabel && <span className="text-xs text-white/40">{sublabel}</span>}
  </div>
);

const TabButton = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300",
      active 
        ? "bg-white/20 text-white shadow-lg shadow-white/5" 
        : "text-white/50 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={20} />
    <span className="font-medium hidden md:block">{label}</span>
  </button>
);

// --- Translations ---

const translations = {
  en: {
    title: "Fractal Hodge-Navier",
    subtitle: "Unified Analysis Framework",
    documentation: "Documentation",
    research: "Research",
    heroTitle: "Complexity Deciphered.",
    heroSubtitle: "Apply fractal geometry and topological data analysis to unravel patterns in medical imaging, porous media, networks, and financial markets.",
    medical: "Medical",
    porous: "Porous",
    networks: "Networks",
    finance: "Finance",
    neurological: "Neurological",
    parameters: "Parameters",
    medicalDesc: "Upload a medical scan (X-ray, MRI, Histology) to analyze its fractal dimension and topological features.",
    uploadImage: "Click to upload image",
    uploadFormats: "PNG, JPG up to 10MB",
    sampleSize: "Sample Size",
    targetPorosity: "Target Porosity",
    runSimulation: "Run Simulation",
    nodeCount: "Node Count",
    edgeDensity: "Edge Density",
    generateNetwork: "Generate Network",
    assetSymbol: "Asset Symbol",
    timeHorizon: "Time Horizon",
    analyzeMarket: "Analyze Market",
    eegDesc: "Analyze EEG time-series data for fractal complexity and seizure markers.",
    uploadData: "Upload CSV/TXT data",
    or: "Or",
    useSample: "Use Sample Signal",
    theoreticalBasis: "Theoretical Basis",
    theoryDesc: "This framework combines Hodge Theory (cohomology of manifolds) with Fractal Geometry to measure the 'roughness' and 'connectivity' of complex systems.",
    processing: "Processing Complex Geometry...",
    awaitingInput: "Awaiting Input",
    awaitingDesc: "Select an analysis domain and provide parameters to begin the fractal-topological decomposition.",
    fractalDim: "Fractal Dim (dH)",
    hausdorff: "Hausdorff Measure",
    betti0: "Betti Number b0",
    betti1: "Betti b1",
    persistence: "Persistence",
    holes: "Topological Holes",
    hurst: "Hurst Exp",
    diagnosis: "Diagnosis",
    permeability: "Permeability",
    clustering: "Clustering",
    volatility: "Volatility",
    entropy: "Entropy",
    riskScore: "Risk Score",
    seizureScore: "Seizure Score",
    confidence: "Confidence",
    recommendation: "Recommendation",
    severity: "Severity",
    qualityScore: "Quality Score",
    networkType: "Network Type",
    action: "Action",
    alertLevel: "Alert Level",
    conclusion: "Analysis Conclusion",
    defaultConclusion: "The system exhibits stable topological features with consistent fractal scaling.",
    privacy: "Privacy",
    terms: "Terms",
    apiRef: "API Reference",
    footer: "Advanced Complexity Labs"
  },
  ar: {
    title: "هودج-نافييه الفركتلي",
    subtitle: "إطار التحليل الموحد",
    documentation: "التوثيق",
    research: "الأبحاث",
    heroTitle: "فك شفرة التعقيد.",
    heroSubtitle: "تطبيق الهندسة الكسيرية وتحليل البيانات الطوبولوجية لكشف الأنماط في التصوير الطبي، المواد المسامية، الشبكات، والأسواق المالية.",
    medical: "طبي",
    porous: "مسامي",
    networks: "شبكات",
    finance: "تمويل",
    neurological: "أعصاب",
    parameters: "المعايير",
    medicalDesc: "قم بتحميل صورة طبية (أشعة، رنين، أنسجة) لتحليل بعدها الكسري وخصائصها الطوبولوجية.",
    uploadImage: "انقر لتحميل الصورة",
    uploadFormats: "PNG, JPG حتى 10 ميجابايت",
    sampleSize: "حجم العينة",
    targetPorosity: "المسامية المستهدفة",
    runSimulation: "تشغيل المحاكاة",
    nodeCount: "عدد العقد",
    edgeDensity: "كثافة الحواف",
    generateNetwork: "إنشاء الشبكة",
    assetSymbol: "رمز الأصل",
    timeHorizon: "الأفق الزمني",
    analyzeMarket: "تحليل السوق",
    eegDesc: "تحليل بيانات EEG للسلاسل الزمنية للكشف عن التعقيد الكسري وعلامات النوبات.",
    uploadData: "تحميل بيانات CSV/TXT",
    or: "أو",
    useSample: "استخدام إشارة عينة",
    theoreticalBasis: "الأساس النظري",
    theoryDesc: "يجمع هذا الإطار بين نظرية هودج (تماثل المانيفولد) والهندسة الكسيرية لقياس 'الخشونة' و'الاتصال' في الأنظمة المعقدة.",
    processing: "جاري معالجة الهندسة المعقدة...",
    awaitingInput: "في انتظار المدخلات",
    awaitingDesc: "اختر مجال التحليل وحدد المعايير لبدء التفكيك الفركتلي-الطوبولوجي.",
    fractalDim: "البعد الكسري (dH)",
    hausdorff: "مقياس هاوسدورف",
    betti0: "عدد بيتي b0",
    betti1: "عدد بيتي b1",
    persistence: "الاستمرارية",
    holes: "الثقوب الطوبولوجية",
    hurst: "معامل هيرست",
    diagnosis: "التشخيص",
    permeability: "النفاذية",
    clustering: "التجميع",
    volatility: "التقلب",
    entropy: "الإنتروبيا",
    riskScore: "درجة المخاطرة",
    seizureScore: "درجة النوبة",
    confidence: "الثقة",
    recommendation: "التوصية",
    severity: "الخطورة",
    qualityScore: "درجة الجودة",
    networkType: "نوع الشبكة",
    action: "الإجراء",
    alertLevel: "مستوى الإنذار",
    conclusion: "خلاصة التحليل",
    defaultConclusion: "يظهر النظام ميزات طوبولوجية مستقرة مع قياس فركتلي متسق.",
    privacy: "الخصوصية",
    terms: "الشروط",
    apiRef: "مرجع API",
    footer: "مختبرات التعقيد المتقدمة"
  }
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState("medical");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "ar">("en");

  // Simulation Parameters State
  const [porousSize, setPorousSize] = useState(128);
  const [porousPorosity, setPorousPorosity] = useState(30);
  const [netNodes, setNetNodes] = useState(150);
  const [netDensity, setNetDensity] = useState(8);
  const [stockSymbol, setStockSymbol] = useState("AAPL");
  const [stockPeriod, setStockPeriod] = useState("1y");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.ok ? res.json() : Promise.reject("Not OK"))
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const t = translations[lang];
  const isRtl = lang === "ar";

  // --- Analysis Handlers ---

  const analyzeMedical = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/analyze-medical", { 
        method: "POST", 
        headers: { "Accept": "application/json" },
        body: formData 
      });
      const text = await res.text();
      
      if (!res.ok) {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || errData.error || "Server error");
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        setResults(JSON.parse(text));
      } else {
        throw new Error(`Expected JSON but received ${contentType}. Body: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzePorous = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-porous", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ size: porousSize, porosity: porousPorosity })
      });
      const text = await res.text();

      if (!res.ok) {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || errData.error || "Server error");
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        setResults(JSON.parse(text));
      } else {
        throw new Error(`Expected JSON but received ${contentType}. Body: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzeNetwork = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-network", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ nodes: netNodes, density: netDensity })
      });
      const text = await res.text();

      if (!res.ok) {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || errData.error || "Server error");
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        setResults(JSON.parse(text));
      } else {
        throw new Error(`Expected JSON but received ${contentType}. Body: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzeStock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ symbol: stockSymbol, period: stockPeriod })
      });
      const text = await res.text();

      if (!res.ok) {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || errData.error || "Server error");
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        setResults(JSON.parse(text));
      } else {
        throw new Error(`Expected JSON but received ${contentType}. Body: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analyzeEEG = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append("eeg_file", file);
    try {
      const res = await fetch("/api/analyze-eeg", { 
        method: "POST", 
        headers: { "Accept": "application/json" },
        body: formData 
      });
      const text = await res.text();

      if (!res.ok) {
        try {
          const errData = JSON.parse(text);
          throw new Error(errData.message || errData.error || "Server error");
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        setResults(JSON.parse(text));
      } else {
        throw new Error(`Expected JSON but received ${contentType}. Body: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Reset results when tab changes
  useEffect(() => {
    setResults(null);
  }, [activeTab]);

  const exportToCSV = () => {
    if (!results) return;
    
    const rows: string[][] = [
      ["Metric", "Value", "Description"]
    ];

    if (results.fractal_dimension !== undefined) rows.push(["Fractal Dimension", results.fractal_dimension.toString(), "Hausdorff Dimension"]);
    if (results.hurst_exponent !== undefined) rows.push(["Hurst Exponent", results.hurst_exponent.toString(), "Persistence/Memory"]);
    if (results.b0 !== undefined) rows.push(["Betti b0", results.b0.toString(), "Connected Components"]);
    if (results.b1 !== undefined) rows.push(["Betti b1", results.b1.toString(), "Holes/Cycles"]);
    
    if (results.severity) rows.push(["Severity", results.severity, "Clinical Severity"]);
    if (results.quality_score) rows.push(["Quality Score", results.quality_score.toString(), "Material Quality"]);
    if (results.avg_clustering) rows.push(["Avg Clustering", results.avg_clustering.toString(), "Network Clustering"]);
    if (results.volatility) rows.push(["Volatility", (results.volatility * 100).toFixed(2) + "%", "Annualized Volatility"]);
    if (results.entropy) rows.push(["Entropy", results.entropy.toString(), "Signal Complexity"]);
    if (results.risk_score) rows.push(["Risk Score", results.risk_score.toString(), "Financial Risk"]);
    if (results.alert_level) rows.push(["Alert Level", results.alert_level.toString(), "Neurological Alert"]);
    
    rows.push(["Diagnosis", results.diagnosis || results.dH_text || results.porosity_text || results.hurst_text || results.seizure_text || "N/A", "Primary Finding"]);
    rows.push(["Recommendation", results.recommendation || (results.recommendations && results.recommendations[0]) || results.action || "N/A", "Suggested Action"]);

    const csvContent = rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analysis_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#0a0510] text-white font-sans selection:bg-purple-500/30",
      isRtl && "font-arabic"
    )} dir={isRtl ? "rtl" : "ltr"}>
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Layers className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">{t.subtitle}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/60">
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider", {
              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20": apiStatus === "online",
              "bg-rose-500/10 text-rose-400 border border-rose-500/20": apiStatus === "offline",
              "bg-white/5 text-white/30 border border-white/10": apiStatus === "checking",
            })}>
              <div className={cn("w-1.5 h-1.5 rounded-full", {
                "bg-emerald-400 animate-pulse": apiStatus === "online",
                "bg-rose-400": apiStatus === "offline",
                "bg-white/20": apiStatus === "checking",
              })} />
              {apiStatus === "online" ? "API Online" : apiStatus === "offline" ? "API Offline" : "Linking..."}
            </div>
            <button 
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/10 transition-all font-mono"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
            <a href="#" className="hover:text-white transition-colors">{t.documentation}</a>
            <a href="#" className="hover:text-white transition-colors">{t.research}</a>
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all">
              v1.0.4
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent"
          >
            {t.heroTitle}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-lg"
          >
            {t.heroSubtitle}
          </motion.p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <TabButton active={activeTab === "medical"} icon={Activity} label={t.medical} onClick={() => setActiveTab("medical")} />
          <TabButton active={activeTab === "porous"} icon={Layers} label={t.porous} onClick={() => setActiveTab("porous")} />
          <TabButton active={activeTab === "network"} icon={Network} label={t.networks} onClick={() => setActiveTab("network")} />
          <TabButton active={activeTab === "finance"} icon={TrendingUp} label={t.finance} onClick={() => setActiveTab("finance")} />
          <TabButton active={activeTab === "eeg"} icon={Brain} label={t.neurological} onClick={() => setActiveTab("eeg")} />
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ChevronRight className={cn("text-purple-500", isRtl && "rotate-180")} size={20} />
                {t.parameters}
              </h3>
              
              <AnimatePresence mode="wait">
                {activeTab === "medical" && (
                  <motion.div 
                    key="medical"
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    className="space-y-6"
                  >
                    <p className="text-sm text-white/60">{t.medicalDesc}</p>
                    <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-white/40 group-hover:text-purple-400 transition-colors" />
                        <p className="mb-2 text-sm text-white/60">{t.uploadImage}</p>
                        <p className="text-xs text-white/40">{t.uploadFormats}</p>
                      </div>
                      <input type="file" className="hidden" onChange={analyzeMedical} accept="image/*" />
                    </label>
                  </motion.div>
                )}

                {activeTab === "porous" && (
                  <motion.div 
                    key="porous"
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <label className="text-white/60">{t.sampleSize}</label>
                        <span className="font-mono text-purple-400">{porousSize}px</span>
                      </div>
                      <input 
                        type="range" 
                        className="w-full accent-purple-500" 
                        min="64" 
                        max="256" 
                        value={porousSize} 
                        onChange={(e) => setPorousSize(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <label className="text-white/60">{t.targetPorosity}</label>
                        <span className="font-mono text-purple-400">{porousPorosity}%</span>
                      </div>
                      <input 
                        type="range" 
                        className="w-full accent-purple-500" 
                        min="10" 
                        max="70" 
                        value={porousPorosity} 
                        onChange={(e) => setPorousPorosity(parseInt(e.target.value))}
                      />
                    </div>
                    <button 
                      onClick={analyzePorous}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
                    >
                      <Play size={18} className={isRtl ? "rotate-180" : ""} /> {t.runSimulation}
                    </button>
                  </motion.div>
                )}

                {activeTab === "network" && (
                  <motion.div 
                    key="network"
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <label className="text-white/60">{t.nodeCount}</label>
                        <span className="font-mono text-purple-400">{netNodes}</span>
                      </div>
                      <input 
                        type="range" 
                        className="w-full accent-purple-500" 
                        min="50" 
                        max="300" 
                        value={netNodes} 
                        onChange={(e) => setNetNodes(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <label className="text-white/60">{t.edgeDensity}</label>
                        <span className="font-mono text-purple-400">{netDensity}%</span>
                      </div>
                      <input 
                        type="range" 
                        className="w-full accent-purple-500" 
                        min="1" 
                        max="20" 
                        value={netDensity} 
                        onChange={(e) => setNetDensity(parseInt(e.target.value))}
                      />
                    </div>
                    <button 
                      onClick={analyzeNetwork}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
                    >
                      <Play size={18} className={isRtl ? "rotate-180" : ""} /> {t.generateNetwork}
                    </button>
                  </motion.div>
                )}

                {activeTab === "finance" && (
                  <motion.div 
                    key="finance"
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">{t.assetSymbol}</label>
                      <input 
                        type="text" 
                        value={stockSymbol} 
                        onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-white/60">{t.timeHorizon}</label>
                      <select 
                        value={stockPeriod}
                        onChange={(e) => setStockPeriod(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="1m">1 Month</option>
                        <option value="3m">3 Months</option>
                        <option value="6m">6 Months</option>
                        <option value="1y">1 Year</option>
                        <option value="2y">2 Years</option>
                      </select>
                    </div>
                    <button 
                      onClick={analyzeStock}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
                    >
                      <TrendingUp size={18} /> {t.analyzeMarket}
                    </button>
                  </motion.div>
                )}

                {activeTab === "eeg" && (
                  <motion.div 
                    key="eeg"
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    className="space-y-6"
                  >
                    <p className="text-sm text-white/60">{t.eegDesc}</p>
                    <label className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-6 h-6 mb-2 text-white/40 group-hover:text-purple-400 transition-colors" />
                        <p className="text-xs text-white/60">{t.uploadData}</p>
                      </div>
                      <input type="file" className="hidden" onChange={analyzeEEG} accept=".csv,.txt" />
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0510] px-2 text-white/40">{t.or}</span></div>
                    </div>
                    <button 
                      onClick={() => analyzeEEG({ target: { files: null } } as any)}
                      className="w-full bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Play size={18} className={isRtl ? "rotate-180" : ""} /> {t.useSample}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info Card */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Info className="text-purple-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold mb-1">{t.theoreticalBasis}</h4>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {t.theoryDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-8 space-y-8">
            {loading ? (
              <div className="h-[600px] bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-white/40 font-mono text-sm animate-pulse">{t.processing}</p>
              </div>
            ) : results ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Metrics Grid */}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-white/80">{t.analysisResults || "Analysis Results"}</h4>
                  <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    <Download size={16} /> {lang === "en" ? "Export CSV" : "تصدير CSV"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard 
                    label={t.fractalDim} 
                    value={results.fractal_dimension?.toFixed(3) ?? results.b0 ?? "—"} 
                    sublabel={results.fractal_dimension ? t.hausdorff : t.betti0}
                    color="purple" 
                  />
                  <MetricCard 
                    label={activeTab === "finance" ? t.hurst : t.betti1} 
                    value={results.hurst_exponent?.toFixed(3) ?? results.b1 ?? "—"} 
                    sublabel={results.hurst_exponent ? t.persistence : t.holes}
                    color="blue" 
                  />
                  <MetricCard 
                    label={activeTab === "medical" ? t.severity : activeTab === "porous" ? t.qualityScore : activeTab === "network" ? t.clustering : activeTab === "finance" ? t.volatility : t.entropy} 
                    value={
                      results.severity ?? 
                      results.quality_score ?? 
                      results.avg_clustering?.toFixed(3) ?? 
                      (results.volatility !== undefined ? (results.volatility * 100).toFixed(1) + "%" : undefined) ??
                      results.entropy?.toFixed(3) ??
                      "—"
                    } 
                    color="emerald" 
                  />
                  <MetricCard 
                    label={activeTab === "finance" ? t.riskScore : activeTab === "eeg" ? t.alertLevel : t.confidence} 
                    value={results.risk_score ?? results.alert_level ?? (results.confidence ? (results.confidence * 100).toFixed(1) + "%" : "94.2%")} 
                    color={(results.risk_score ?? 0) > 60 || (results.alert_level ?? 0) > 60 || (results.seizure_score ?? 0) > 60 ? "rose" : "emerald"} 
                  />
                </div>

                {/* Enhanced Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h5 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">{t.recommendation}</h5>
                    <p className="text-lg font-medium">
                      {results.recommendation || (results.recommendations && results.recommendations[0]) || results.action || results.hurst_advice || "No specific recommendation"}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h5 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4">
                      {activeTab === "network" ? t.networkType : t.diagnosis}
                    </h5>
                    <p className="text-lg font-medium">
                      {results.network_type || results.dH_text || results.porosity_text || results.hurst_text || results.seizure_text || "Analysis complete"}
                    </p>
                  </div>
                </div>

                {/* Main Plot */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden">
                  <Plot
                    data={
                      (activeTab === "medical" || activeTab === "porous") && (results.grid || results.matrix) ? [
                        {
                          z: results.grid || results.matrix,
                          type: "heatmap",
                          colorscale: "Viridis",
                          showscale: false
                        }
                      ] : activeTab === "network" && results.adj ? [
                        {
                          x: Array.from({ length: results.adj.length }, (_, i) => Math.cos(i * 2 * Math.PI / results.adj.length)),
                          y: Array.from({ length: results.adj.length }, (_, i) => Math.sin(i * 2 * Math.PI / results.adj.length)),
                          mode: "markers",
                          type: "scatter",
                          marker: { size: 10, color: results.degrees, colorscale: "Viridis" }
                        }
                      ] : (results.prices || results.signal) ? [
                        {
                          y: results.prices || results.signal,
                          type: "scatter",
                          mode: "lines",
                          line: { color: "#a855f7", width: 2 }
                        }
                      ] : []
                    }
                    layout={{
                      autosize: true,
                      height: 450,
                      paper_bgcolor: "rgba(0,0,0,0)",
                      plot_bgcolor: "rgba(0,0,0,0)",
                      margin: { l: 40, r: 20, t: 20, b: 40 },
                      xaxis: { gridcolor: "rgba(255,255,255,0.05)", tickfont: { color: "rgba(255,255,255,0.4)" } },
                      yaxis: { gridcolor: "rgba(255,255,255,0.05)", tickfont: { color: "rgba(255,255,255,0.4)" } },
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    className="w-full"
                  />
                </div>

                {/* Laplacian Spectrum (Medical Only) */}
                {activeTab === "medical" && results.spectrum && (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h5 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-6">Laplacian Spectral Fingerprint</h5>
                    <div className="h-[200px]">
                      <Plot
                        data={[
                          {
                            x: results.spectrum.map((_: any, i: number) => i),
                            y: results.spectrum,
                            type: "bar",
                            marker: { color: "#a855f7" }
                          }
                        ]}
                        layout={{
                          autosize: true,
                          height: 200,
                          paper_bgcolor: "rgba(0,0,0,0)",
                          plot_bgcolor: "rgba(0,0,0,0)",
                          margin: { l: 40, r: 20, t: 10, b: 30 },
                          xaxis: { gridcolor: "rgba(255,255,255,0.05)", tickfont: { color: "rgba(255,255,255,0.4)" } },
                          yaxis: { gridcolor: "rgba(255,255,255,0.05)", tickfont: { color: "rgba(255,255,255,0.4)" } },
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Analysis Summary */}
                <div className={cn(
                  "p-8 rounded-3xl border flex items-center gap-6",
                  (results.risk_score ?? 0) > 60 || (results.seizure_score ?? 0) > 60 || results.diagnosis?.includes("⚠️")
                    ? "bg-rose-500/10 border-rose-500/20"
                    : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl",
                    (results.risk_score ?? 0) > 60 || (results.seizure_score ?? 0) > 60 || results.diagnosis?.includes("⚠️")
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {results.risk_score > 60 || results.seizure_score > 60 || results.diagnosis?.includes("⚠️") 
                      ? <AlertTriangle size={32} /> 
                      : <CheckCircle2 size={32} />
                    }
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">{t.conclusion}</h4>
                    <p className="text-white/60">
                      {results.outlook || results.diagnosis || t.defaultConclusion}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <BarChart3 className="text-white/20" size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t.awaitingInput}</h3>
                <p className="text-white/40 max-w-md">
                  {t.awaitingDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-40">
            <Layers size={20} />
            <span className="text-sm font-mono uppercase tracking-widest">{t.title} {t.subtitle}</span>
          </div>
          <div className="flex gap-8 text-xs text-white/40 uppercase tracking-widest font-mono">
            <a href="#" className="hover:text-white transition-colors">{t.privacy}</a>
            <a href="#" className="hover:text-white transition-colors">{t.terms}</a>
            <a href="#" className="hover:text-white transition-colors">{t.apiRef}</a>
          </div>
          <p className="text-xs text-white/20 font-mono">© 2026 {t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
