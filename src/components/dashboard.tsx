"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity, ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Droplets,
  Dumbbell, Flame, HeartPulse, Info, LayoutDashboard, Leaf, MessageSquare, Mic,
  MicOff, Minus, Moon, Pill, Plus, RefreshCw, Ruler, Scale, Send, Share2, ShieldCheck,
  Smartphone, Sparkles, Target, Timer, Trash2, TrendingUp, UtensilsCrossed, Waves, X, Zap,
  type LucideIcon,
} from "lucide-react";
import {
  CARB_OPTIONS, DEFAULT_SETTINGS, FOCUS_OPTIONS, GOALS, METABOLIC_STATS,
  MODE_OPTIONS, PROTEIN_OPTIONS, WEIGH_DAYS, WORKOUTS, addMacros, clampPercent,
  formatDay, formatDecimal, formatInt, getFocusLabel, getFocusSubtitle, getModeLabel,
  getPlannedMeals, getWaterGoal, localDay, shiftDay, type ActivityRecord, type DayData,
  type DaySettings, type FocusKey, type HistoryPoint, type MealSlot, type PlannedMeal,
  type TrainingMode,
} from "@/lib/fitness";

type View = "overview" | "nutrition" | "training" | "progress" | "guide";
type Modal = "plan" | "activity" | "weight" | "chat" | null;

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "nutrition", label: "Nutrição", icon: UtensilsCrossed },
  { id: "training", label: "Treinos (ABCAB)", icon: Dumbbell },
  { id: "progress", label: "Evolução", icon: TrendingUp },
  { id: "guide", label: "Dossiê Clínico", icon: BookOpen },
];

const MEAL_STYLE: Record<MealSlot, { icon: LucideIcon; color: string; label: string }> = {
  almoco: { icon: UtensilsCrossed, color: "orange", label: "Almoço Estrutural" },
  lanche: { icon: Zap, color: "violet", label: "Pré-Treino" },
  gatilho: { icon: Flame, color: "orange", label: "Gatilho Ergogênico" },
  jantar: { icon: Moon, color: "blue", label: "Jantar Recuperativo" },
  extra: { icon: Plus, color: "green", label: "Alimento Extra" },
};

const VIEW_COPY: Record<View, { eyebrow: string; title: string; subtitle: string }> = {
  overview: { eyebrow: "DOSSIÊ CLÍNICO", title: "Hoje é dia de evoluir.", subtitle: "Janela 11h30 às 22h00 • Recomposição corporal para força e areia." },
  nutrition: { eyebrow: "CRONONUTRIÇÃO", title: "Coma bem. Renda no treino.", subtitle: "3 refeições estratégicas + gatilho ergogênico de paçoca na dobradinha." },
  training: { eyebrow: "DIVISÃO ABCAB", title: "Hipertrofia & Areia.", subtitle: "Exercícios com substitutos imediatos do dossiê e registro ágil de futevôlei." },
  progress: { eyebrow: "EVOLUÇÃO & BIOMETRIA", title: "Consistência e Métricas.", subtitle: "Taxa basal, comparação de peso, dia oficial de pesagem e medidas corporais." },
  guide: { eyebrow: "PROTOCOLO HÍBRIDO", title: "Dossiê Clínico de Performance.", subtitle: "Pesos de alimentos prontos, matriz de trocas e diretrizes de saciedade." },
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><path d="M5 21h7l4-10 5 17 4-9h8" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div className="brand-copy"><strong>pulso<span>.</span></strong>{!compact && <small>PERFORMANCE DIÁRIA</small>}</div>
    </div>
  );
}

function MacroBar({ label, value, goal, unit, tone, note }: { label: string; value: number; goal: number; unit: string; tone: string; note?: string }) {
  return (
    <div className="macro-item">
      <div className="macro-item-top"><div className="macro-name"><span className={`macro-dot ${tone}`} />{label}{note && <span className="macro-note">{note}</span>}</div><span className="macro-numbers"><strong>{formatInt(value)}</strong> / {goal}{unit}</span></div>
      <div className="progress-track"><div className={`progress-fill ${tone}`} style={{ width: `${clampPercent(value, goal)}%` }} /></div>
    </div>
  );
}

function CompactStat({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: string }) {
  return <div className="compact-stat"><div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={2.1} /></div><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-detail">{detail}</span></div>;
}

function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} /></div><strong>{title}</strong><p>{text}</p></div>;
}

function WeeklyBars({ history, onPick, compact = false }: { history: HistoryPoint[]; onPick: (day: string) => void; compact?: boolean }) {
  return (
    <div className={`weekly-chart ${compact ? "weekly-chart-compact" : ""}`}>
      <div className="chart-plot"><div className="chart-goal-line"><span>meta · 1.950</span></div>
        {history.map((item) => <button key={item.day} type="button" className={`chart-column ${item.day === localDay() ? "chart-column-today" : ""}`} onClick={() => onPick(item.day)} title={`${formatDay(item.day)}: ${formatInt(item.calories)} kcal`}>
          <span className="chart-bar-area"><span className={`chart-bar ${item.calories === 0 ? "chart-bar-empty" : ""}`} style={{ height: `${Math.max(3, Math.min(100, (item.calories / 2400) * 100))}%` }} /></span>
          <span className="chart-day">{formatDay(item.day, { weekday: "short" }).replace(".", "")}</span>
        </button>)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [date, setDate] = useState(() => localDay());
  const dateRef = useRef(date);
  dateRef.current = date;
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("almoco");

  // Água personalizada
  const [customWater, setCustomWater] = useState("");

  // Alternância de exercício substituto (id do exercício -> boolean)
  const [exerciseSubs, setExerciseSubs] = useState<Record<string, boolean>>({});

  // Futevôlei duração rápida
  const [sandDuration, setSandDuration] = useState("60");

  // Chat & Voz
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Forms
  const [activityForm, setActivityForm] = useState({ type: "musculacao" as TrainingMode, label: "Musculação (Treino A)", duration: "40" });
  const [weightForm, setWeightForm] = useState({ weight: "", waist: "", chest: "", arms: "", thighs: "", hips: "" });

  const loadDay = useCallback(async (day: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetch(`/api/day?date=${encodeURIComponent(day)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha ao carregar o dia.");
      if (day === dateRef.current) setData(result as DayData);
    } catch (cause) {
      setToast({ text: cause instanceof Error ? cause.message : "Não foi possível carregar os dados.", error: true });
    } finally {
      if (day === dateRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDay(date); }, [date, loadDay]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setModal(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modal]);

  async function save(action: string, fields: Record<string, unknown>, method: "POST" | "DELETE" = "POST", message?: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    try {
      const response = await fetch("/api/day", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, date, ...fields }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar.");
      await loadDay(date, false);
      if (message) setToast({ text: message });
      return true;
    } catch (cause) {
      setToast({ text: cause instanceof Error ? cause.message : "Tente novamente.", error: true });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openActivity(type?: TrainingMode) {
    const chosen = type && type !== "descanso" ? type : "musculacao";
    setActivityForm({ type: chosen, label: chosen === "futevolei" ? "Futevôlei (Areia)" : "Musculação (Treino A)", duration: chosen === "musculacao" ? "40" : "60" });
    setModal("activity");
  }

  function openWeight() {
    setWeightForm({
      weight: data?.measurement?.weight?.toString() ?? "",
      waist: data?.measurement?.waist?.toString() ?? "",
      chest: data?.measurement?.chest?.toString() ?? "",
      arms: data?.measurement?.arms?.toString() ?? "",
      thighs: data?.measurement?.thighs?.toString() ?? "",
      hips: data?.measurement?.hips?.toString() ?? "",
    });
    setModal("weight");
  }

  // Web Speech API Voice Recognition
  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast({ text: "Reconhecimento de voz não suportado neste navegador. Digite sua mensagem no campo.", error: true });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setToast({ text: "Ouvindo... Pode falar o que você fez!" });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(transcript);
          void sendChatMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          setToast({ text: `Erro no microfone: ${event.error}`, error: true });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setToast({ text: "Não foi possível ativar o microfone.", error: true });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  async function sendChatMessage(customText?: string) {
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend || chatSending) return;
    setChatSending(true);
    setChatInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, date }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao processar mensagem");

      setToast({ text: json.reply });
      await loadDay(date, false);
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Erro ao enviar mensagem", error: true });
    } finally {
      setChatSending(false);
    }
  }

  const settings = data?.settings ?? DEFAULT_SETTINGS;
  const foods = data?.foods ?? [];
  const waters = data?.waters ?? [];
  const activities = data?.activities ?? [];
  const history = data?.history ?? Array.from({ length: 7 }, (_, index) => ({ day: shiftDay(date, index - 6), calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, workouts: 0, weight: null }));
  const totals = addMacros(...foods);
  const waterTotal = waters.reduce((sum, item) => sum + item.amount, 0);
  const waterGoal = getWaterGoal(settings.trainingMode);
  const meals = getPlannedMeals(settings);
  const remaining = Math.max(0, GOALS.calories - totals.calories);
  const proteinLeft = Math.max(0, GOALS.protein - totals.protein);
  const selectedMeal = meals.find((meal) => meal.slot === selectedSlot);
  const mealRegistered = (slot: MealSlot) => foods.some((item) => item.mealSlot === slot && item.source === "plan");
  const isGymDay = settings.trainingMode === "musculacao" || settings.trainingMode === "dobradinha";
  const isSandDay = settings.trainingMode === "futevolei" || settings.trainingMode === "dobradinha";
  const gymExercises = WORKOUTS[settings.workoutFocus] || WORKOUTS.treinoA;
  const completedExercises = gymExercises.filter((item) => data?.exercises.some((entry) => entry.focus === settings.workoutFocus && entry.exerciseId === item.id)).length;
  const hasGymLog = activities.some((item) => item.type === "musculacao");
  const sandLogs = activities.filter((item) => item.type === "futevolei");
  const hasSandLog = sandLogs.length > 0;
  const supplements = data?.supplements ?? [];
  const creatineTaken = supplements.some((item) => item.name === "Creatina" && item.taken);
  const chatMessagesList = data?.chatHistory ?? [];

  // Cálculos de peso atual e anterior
  const measurementHistory = data?.measurementHistory ?? [];
  const latestWeight = measurementHistory.length > 0 ? measurementHistory[measurementHistory.length - 1] : null;
  const previousWeight = measurementHistory.length > 1 ? measurementHistory[measurementHistory.length - 2] : null;
  const weightDelta = latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : null;

  // Lógica do dia oficial de pesagem
  const currentDayOfWeekKey = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][new Date(`${date}T12:00:00`).getDay()];
  const isOfficialWeighDay = currentDayOfWeekKey === settings.weighInDay;

  async function updateSettings(updates: Partial<DaySettings>) { await save("settings", { updates }); }
  async function registerMeal(meal: PlannedMeal) {
    const okay = await save("food", { mealSlot: meal.slot, title: meal.title, details: meal.ingredients.join(" · "), ...meal.macros, source: "plan" }, "POST", "Refeição adicionada ao seu dia.");
    if (okay) setModal(null);
  }
  async function addWater(amount: number) { await save("water", { amount }, "POST", `+${amount} ml de água registrados.`); }
  async function toggleCreatine() {
    const next = !creatineTaken;
    await save("supplement", { name: "Creatina", amount: "5 g", taken: next }, "POST", next ? "Creatina marcada como tomada (5g)." : "Creatina desmarcada.");
  }
  async function registerSession(type: TrainingMode, label: string, duration: number) {
    await save("activity", { type, label, duration }, "POST", "Treino registrado com sucesso!");
  }
  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const okay = await save("activity", { type: activityForm.type, label: activityForm.label, duration: Number(activityForm.duration) }, "POST", "Atividade registrada com sucesso.");
    if (okay) setModal(null);
  }
  async function submitWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Record<string, unknown> = {
      weight: Number(weightForm.weight.replace(",", ".")),
      waist: weightForm.waist ? Number(weightForm.waist.replace(",", ".")) : null,
      chest: weightForm.chest ? Number(weightForm.chest.replace(",", ".")) : null,
      arms: weightForm.arms ? Number(weightForm.arms.replace(",", ".")) : null,
      thighs: weightForm.thighs ? Number(weightForm.thighs.replace(",", ".")) : null,
      hips: weightForm.hips ? Number(weightForm.hips.replace(",", ".")) : null,
    };
    const okay = await save("weight", payload, "POST", "Medidas corporais salvas com sucesso.");
    if (okay) setModal(null);
  }
  function exportHistory() {
    const lines = ["Data;Calorias (kcal);Proteínas (g);Carboidratos (g);Gorduras (g);Água (ml);Treinos;Peso (kg)", ...history.map((item) => [item.day, item.calories, formatDecimal(item.protein, 1), formatDecimal(item.carbs, 1), formatDecimal(item.fat, 1), item.water, item.workouts, item.weight ? formatDecimal(item.weight, 1) : ""].join(";"))];
    const blob = new Blob(["\uFEFF", lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `pulso-dossie-${date}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast({ text: "Histórico exportado em CSV." });
  }
  function pickHistoryDay(day: string) { setDate(day); navigate("overview"); }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <Logo />
          <div className="sidebar-navigation">
            <p className="nav-caption">MENU PRINCIPAL</p>
            <nav aria-label="Navegação principal">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={`nav-item ${view === id ? "active" : ""}`} onClick={() => navigate(id)}>
                  <Icon size={19} strokeWidth={view === id ? 2.2 : 1.9} />
                  <span>{label}</span>
                  {view === id && <span className="nav-active-dot" />}
                </button>
              ))}
              <button type="button" className="nav-item nav-chat-btn" onClick={() => setModal("chat")}>
                <MessageSquare size={19} />
                <span>Assistente de Voz</span>
              </button>
            </nav>
          </div>
          <div className="sidebar-bottom">
            <div className="sidebar-goal">
              <div className="sidebar-goal-icon"><Target size={19} /></div>
              <span>META DO DOSSIÊ</span>
              <strong>1.950 <small>kcal</small></strong>
              <p>TMB: {METABOLIC_STATS.bmr} kcal • Janela: 11h30 às 22h00</p>
              <div className="sidebar-goal-line" />
            </div>
            <div className="sidebar-profile">
              <div className="avatar">AT</div>
              <div><strong>Atleta Híbrido</strong><span>ABCAB + Futevôlei</span></div>
              <div className="profile-status" />
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <div className="mobile-brand">
          <Logo compact />
          <div className="mobile-top-btns">
            <button className="mobile-chat-btn" type="button" onClick={() => setModal("chat")} aria-label="Assistente de voz"><Mic size={19} /></button>
            <button className="mobile-guide" type="button" onClick={() => navigate("guide")} aria-label="Abrir dossiê"><BookOpen size={19} /></button>
          </div>
        </div>
        <div className="topbar">
          <div className="breadcrumb">
            <span>Dossiê Clínico</span>
            <ChevronRight size={14} />
            <strong>{VIEW_COPY[view].eyebrow.toLowerCase()}</strong>
          </div>
          <div className="topbar-actions">
            <button className="voice-assistant-badge" type="button" onClick={() => setModal("chat")}>
              <Mic size={15} />
              <span>Falar por Voz / Chat</span>
            </button>
            <span className="live-indicator"><span /> PROTOCOLO HÍBRIDO ATIVO</span>
            <button className="topbar-help" type="button" onClick={() => navigate("guide")} title="Abrir Dossiê"><BookOpen size={18} /></button>
            <div className="topbar-avatar">AT</div>
          </div>
        </div>

        <header className="page-intro">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> {formatDay(date, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()} <span className="eyebrow-separator">/</span> {VIEW_COPY[view].eyebrow}</div>
            <h1>{VIEW_COPY[view].title}</h1>
            <p>{VIEW_COPY[view].subtitle}</p>
          </div>
          <div className="intro-controls">
            <div className="date-control">
              <button type="button" onClick={() => setDate(shiftDay(date, -1))} aria-label="Dia anterior"><ChevronLeft size={18} /></button>
              <label className="date-current">
                <CalendarDays size={17} />
                <span>{date === localDay() ? "Hoje, " : ""}{formatDay(date, { day: "numeric", month: "short" })}</span>
                <input type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} aria-label="Escolher data" />
              </label>
              <button type="button" onClick={() => setDate(shiftDay(date, 1))} aria-label="Próximo dia"><ChevronRight size={18} /></button>
            </div>
            <button className="secondary-button" type="button" onClick={() => setModal("chat")}>
              <Mic size={16} /> Falar o que fez
            </button>
          </div>
        </header>

        {loading && <div className="loading-line" aria-label="Carregando dados" />}

        {/* Quick Voice Bar */}


        {view === "overview" && <div className="view-content overview-view">
          <div className="hero-grid">
            <section className="calorie-hero">
              <div className="hero-noise" />
              <div className="hero-copy">
                <div className="hero-eyebrow"><span className="hero-eyebrow-icon"><Sparkles size={14} /></span> META DIÁRIA · 1.950 KCAL</div>
                <h2>Combustível para <em>força e areia.</em></h2>
                <p>3 refeições principais + gatilho ergogênico de paçoca na dobradinha. Janela fecha às 22h00.</p>
                <div className="hero-consumed">
                  <strong>{formatInt(totals.calories)}</strong>
                  <div><b>kcal consumidas</b><span>de 1.950 kcal prescritas</span></div>
                </div>
                <div className="hero-meter"><span style={{ width: `${clampPercent(totals.calories, GOALS.calories)}%` }} /></div>
                <div className="hero-footer">
                  <span><ShieldCheck size={16} /> Proteína intocável: 140 g/dia</span>
                  <button type="button" onClick={() => navigate("nutrition")}>Ver refeições <ArrowRight size={16} /></button>
                </div>
              </div>
              <div className="calorie-ring-wrap">
                <div className="ring-decoration" />
                <svg className="calorie-ring" viewBox="0 0 220 220" aria-hidden="true">
                  <circle cx="110" cy="110" r="83" className="ring-track" />
                  <circle cx="110" cy="110" r="83" className="ring-progress" strokeDasharray={2 * Math.PI * 83} strokeDashoffset={(2 * Math.PI * 83) * (1 - Math.min(1, remaining / GOALS.calories))} />
                </svg>
                <div className="ring-label">
                  <span>AINDA RESTAM</span>
                  <strong>{formatInt(remaining)}</strong>
                  <small>kcal para 1.950</small>
                </div>
              </div>
            </section>

            <section className="panel macro-card">
              <div className="panel-topline">
                <span className="panel-kicker">ARQUITETURA DE MACROS (DOSSIÊ)</span>
                <div className="tiny-icon"><Activity size={17} /></div>
              </div>
              <h3>Distribuição Diária Calórica</h3>
              <p>Carbos (47% • 228g) | Proteínas (28% • 140g) | Gorduras (25% • 54g)</p>
              <div className="macro-list">
                <MacroBar label="Proteínas" value={totals.protein} goal={GOALS.protein} unit="g" tone="lime" note="SÍNTESE MÁXIMA" />
                <MacroBar label="Carboidratos" value={totals.carbs} goal={GOALS.carbs} unit="g" tone="orange" note="AREIA & GLICOGÊNIO" />
                <MacroBar label="Gorduras" value={totals.fat} goal={GOALS.fat} unit="g" tone="violet" note="HORMONAL (MAX 54g)" />
              </div>
              <div className="macro-footer">
                <span className="macro-footer-icon"><Info size={15} /></span>
                <span>{proteinLeft > 0 ? `Faltam ${formatInt(proteinLeft)} g de proteína para a meta de 140 g.` : "Meta de proteína de 140g alcançada. Parabéns!"}</span>
              </div>
            </section>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-main-column">
              <section className="panel meal-section">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">CRONONUTRIÇÃO PRESCRITA</span>
                    <h2>Suas Refeições do Dia</h2>
                    <p>Almoço (11h30) • Pré-Treino (14h45) • Jantar (20h30) + Paçoca na dobradinha.</p>
                  </div>
                  <button type="button" className="text-link" onClick={() => navigate("nutrition")}>Ver cardápio <ArrowRight size={16} /></button>
                </div>
                <div className="meal-timeline">
                  {meals.map((meal) => {
                    const StyleIcon = MEAL_STYLE[meal.slot]?.icon ?? UtensilsCrossed;
                    const registered = mealRegistered(meal.slot);
                    return (
                      <div className="timeline-row" key={meal.slot}>
                        <div className="timeline-time">{meal.time}</div>
                        <div className="timeline-rail"><span className={`timeline-point ${registered ? "done" : ""}`} /></div>
                        <div className="timeline-meal">
                          <div className={`meal-symbol ${MEAL_STYLE[meal.slot]?.color ?? "green"}`}><StyleIcon size={20} strokeWidth={1.9} /></div>
                          <div className="timeline-meal-copy">
                            <span className="timeline-tag">{meal.tag}</span>
                            <strong>{meal.title}</strong>
                            <small>{meal.subtitle}</small>
                          </div>
                          <div className="timeline-meal-action">
                            <span><b>{formatInt(meal.macros.calories)}</b> kcal</span>
                            <button type="button" className={registered ? "round-action done" : "round-action"} onClick={() => { setSelectedSlot(meal.slot); setModal("plan"); }} aria-label={`${registered ? "Ver" : "Registrar"} ${MEAL_STYLE[meal.slot]?.label}`}>
                              <span>{registered ? <Check size={18} /> : <Plus size={19} />}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="meal-section-bottom">
                  <span><Sparkles size={15} /> Pesos de alimentos prontos/cozidos conforme o dossiê</span>
                  <button type="button" onClick={() => navigate("nutrition")}>Ajustar trocas <ArrowRight size={15} /></button>
                </div>
              </section>

              <div className="insight-strip">
                <span className="insight-strip-icon"><Zap size={20} fill="currentColor" /></span>
                <div>
                  <strong>{settings.trainingMode === "dobradinha" ? "Protocolo Sessão Dupla (Força + Areia)" : settings.snackOption === "romeuJulieta" ? "Regra Clínica: Protocolo Romeu & Julieta" : "Diretriz Clínica: Janela Alimentar"}</strong>
                  <p>
                    {settings.trainingMode === "dobradinha"
                      ? "Dia com Gatilho Ergogênico ativo: 1 Paçoca (20g) 15 min antes da areia para glicemia estável e hidratação reforçada para 4,0L."
                      : settings.snackOption === "romeuJulieta"
                      ? "Você escolheu queijo no lanche: o ovo inteiro e azeite do jantar devem ser retirados para manter as gorduras em 54g."
                      : "Sua janela é de 11h30 às 22h00. Nada de ceia às 22h: o jantar recuperativo às 20h30 fecha o consumo energético do dia."}
                  </p>
                </div>
                <button type="button" onClick={() => navigate("guide")} aria-label="Ver dossiê clínico"><ArrowUpRight size={19} /></button>
              </div>
            </div>

            <div className="dashboard-side-column">
              <section className="panel water-card">
                <div className="water-top">
                  <div>
                    <span className="panel-kicker">HIDRATAÇÃO BASE</span>
                    <h2>Água em dia</h2>
                  </div>
                  <div className="water-icon"><Droplets size={22} /></div>
                </div>
                <div className="water-main">
                  <div>
                    <strong>{formatDecimal(waterTotal / 1000, 1)}<span> L</span></strong>
                    <p>de {formatDecimal(waterGoal / 1000, 1)} L prescritos no dossiê</p>
                  </div>
                  <div className="water-bottle">
                    <div className="bottle-cap" />
                    <div className="bottle-body">
                      <div className="bottle-fill" style={{ height: `${clampPercent(waterTotal, waterGoal)}%` }} />
                      <Droplets size={21} />
                    </div>
                  </div>
                </div>
                <div className="water-segments">{Array.from({ length: 10 }, (_, i) => <span key={i} className={waterTotal / waterGoal > i / 10 ? "filled" : ""} />)}</div>

                {/* Input para digitar quantidade exata de água (ex: 126 ml) */}
                <form className="water-custom-form" onSubmit={(e) => {
                  e.preventDefault();
                  const val = parseInt(customWater, 10);
                  if (!Number.isNaN(val) && val > 0 && val <= 4000) {
                    void addWater(val);
                    setCustomWater("");
                  }
                }}>
                  <input
                    type="number"
                    min="1"
                    max="4000"
                    placeholder="Digitar ml exato (ex: 126)"
                    value={customWater}
                    onChange={(e) => setCustomWater(e.target.value)}
                  />
                  <button type="submit" disabled={!customWater.trim() || busy}>
                    <Plus size={14} /> Somar ml
                  </button>
                </form>

                <div className="water-actions">
                  <button type="button" onClick={() => addWater(250)} disabled={busy}><Plus size={14} /> 250 ml</button>
                  <button type="button" onClick={() => addWater(500)} disabled={busy}><Plus size={14} /> 500 ml</button>
                  <button type="button" onClick={() => addWater(1200)} disabled={busy} title="Adicionar 1.2L"><Plus size={14} /> 1.2 L</button>
                  <button className="water-undo" type="button" onClick={() => waters.length && save("water", { id: waters[waters.length - 1].id }, "DELETE", "Último copo removido.")} disabled={busy || !waters.length} title="Desfazer" aria-label="Desfazer"><Minus size={17} /></button>
                </div>
                <p className="water-hint">Diretriz clínica: Ingerir 1,5L a 2,0L antes das 11h30 e 400ml junto ao jantar.</p>
              </section>

              {/* Suplemento Creatina 5g */}
              <section className={`panel supplement-card ${creatineTaken ? "taken" : ""}`}>
                <div className="supplement-top">
                  <div className="supplement-icon"><Pill size={21} /></div>
                  <div className="supplement-label">
                    <span className="panel-kicker">SUPLEMENTAÇÃO DIÁRIA</span>
                    <strong>Creatina Monohidratada · 5 g</strong>
                  </div>
                  <button type="button" className={`toggle-switch ${creatineTaken ? "on" : ""}`} onClick={() => toggleCreatine()} disabled={busy} aria-pressed={creatineTaken} aria-label={creatineTaken ? "Desmarcar creatina" : "Marcar creatina como tomada"}>
                    <span />
                  </button>
                </div>
                <p>{creatineTaken ? "Creatina de 5g tomada hoje! Consistência perfeita." : "Marque aqui quando tomar seus 5g de Creatina (todos os dias)."}</p>
                {creatineTaken && <span className="supplement-check"><CheckCircle2 size={14} /> Tomada hoje</span>}
              </section>

              <section className="workout-teaser">
                <div className="workout-teaser-shade" />
                <div className="workout-teaser-content">
                  <div className="workout-teaser-label"><span /> {isGymDay ? "DIVISÃO ABCAB" : "AREIA / FUTEVÔLEI"}</div>
                  <h2>{settings.trainingMode === "descanso" ? "Recuperação ativa" : isGymDay ? getFocusLabel(settings.workoutFocus) : getModeLabel(settings.trainingMode)}</h2>
                  <p><Clock3 size={15} /> {settings.trainingMode === "descanso" ? "Mobilidade & descanso" : `${settings.trainingTime} · ${isGymDay ? "35–40 min • Vol. Reduzido" : "sessão na areia"}`}</p>
                  <button type="button" onClick={() => navigate("training")}>{settings.trainingMode === "descanso" ? "Ver orientações" : "Ver treino"}<ArrowRight size={16} /></button>
                </div>
              </section>

              <div className="side-note">
                <span><Flame size={18} /></span>
                <div>
                  <strong>Regra de ouro do dossiê:</strong>
                  <p>140g de proteína garante preservação de massa magra. Carbos sustentam a explosão na areia.</p>
                </div>
              </div>
            </div>
          </div>

          <section className="panel weekly-peek">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">HISTÓRICO SEMANAL</span>
                <h2>Consistência dos últimos 7 dias</h2>
                <p>Toque em uma coluna para ver o dia detalhado.</p>
              </div>
              <button className="text-link" type="button" onClick={() => navigate("progress")}>Ver evolução completa <ArrowRight size={16} /></button>
            </div>
            <WeeklyBars history={history} onPick={pickHistoryDay} compact />
          </section>
        </div>}

        {view === "nutrition" && <div className="view-content nutrition-view">
          <div className="compact-stats-grid">
            <CompactStat icon={Flame} label="Calorias" value={`${formatInt(totals.calories)} / 1.950`} detail="kcal consumidas" tone="orange" />
            <CompactStat icon={ShieldCheck} label="Proteínas" value={`${formatInt(totals.protein)} / 140`} detail="gramas · síntese máxima" tone="green" />
            <CompactStat icon={Zap} label="Carboidratos" value={`${formatInt(totals.carbs)} / 228`} detail="gramas · areia & glicogênio" tone="violet" />
            <CompactStat icon={Droplets} label="Gorduras" value={`${formatInt(totals.fat)} / 54`} detail="gramas · teto hormonal" tone="blue" />
          </div>

          <div className="nutrition-layout">
            <div className="nutrition-main">
              <section className="panel meal-builder">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">MATRIZ DE TROCAS DIRETAS</span>
                    <h2>Monte o cardápio do seu dia</h2>
                    <p>Pesos pesados prontos/cozidos conforme Tabela de Trocas do Dossiê Clínico.</p>
                  </div>
                  <span className="builder-badge"><Sparkles size={14} /> Equivalência exata</span>
                </div>

                <div className="builder-grid">
                  <div className="builder-group">
                    <div className="builder-group-title"><span className="builder-number">01</span><strong>Almoço (11h30)</strong><small>~640 kcal</small></div>
                    <label>Carboidrato (Grupo A)
                      <select value={settings.lunchCarb} onChange={(event) => updateSettings({ lunchCarb: event.target.value as DaySettings["lunchCarb"] })} disabled={busy}>
                        {Object.entries(CARB_OPTIONS).map(([key, value]) => <option key={key} value={key}>{value.label} · {value.amount}</option>)}
                      </select>
                    </label>
                    <label>Proteína (Grupo B)
                      <select value={settings.lunchProtein} onChange={(event) => updateSettings({ lunchProtein: event.target.value as DaySettings["lunchProtein"] })} disabled={busy}>
                        <option value="frangoOvo">Frango (100–110g) + 1 Ovo Cozido</option>
                        <option value="frangoPuro">Peito de Frango Puro (150g)</option>
                        <option value="carneMagra">Cortes Bovinos Magros (130–140g)</option>
                        <option value="lomboAtum">Lombo Suíno (140g) ou Atum + 2 Ovos</option>
                      </select>
                    </label>
                  </div>

                  <div className="builder-group">
                    <div className="builder-group-title"><span className="builder-number">02</span><strong>Pré-Treino (14h45)</strong><small>~390 kcal</small></div>
                    <label>Combustível da Tarde (Grupo C)
                      <select value={settings.snackOption} onChange={(event) => updateSettings({ snackOption: event.target.value as DaySettings["snackOption"] })} disabled={busy}>
                        <option value="aveiaWhey">Aveia (40g) + Whey (30g) + 1 Fruta</option>
                        <option value="romeuJulieta">Pão + Queijo (30g) + Goiabada (25g) + Whey</option>
                        <option value="paoFrango">2 Fatias Pão + 90g Frango + Fruta (Sem Whey)</option>
                      </select>
                    </label>
                    {settings.snackOption === "romeuJulieta" && (
                      <div className="builder-reminder"><Info size={14} /> Romeu & Julieta ativo: ovo e azeite do jantar zerados automaticamente.</div>
                    )}
                  </div>

                  <div className="builder-group">
                    <div className="builder-group-title"><span className="builder-number">03</span><strong>Jantar (20h30)</strong><small>~830 kcal</small></div>
                    <label>Carboidrato (Grupo A)
                      <select value={settings.dinnerCarb} onChange={(event) => updateSettings({ dinnerCarb: event.target.value as DaySettings["dinnerCarb"] })} disabled={busy}>
                        {Object.entries(CARB_OPTIONS).map(([key, value]) => <option key={key} value={key}>{value.label} · {value.amount}</option>)}
                      </select>
                    </label>
                    <label>Proteína (Grupo B)
                      <select value={settings.snackOption === "romeuJulieta" ? "frangoPuro" : settings.dinnerProtein} onChange={(event) => updateSettings({ dinnerProtein: event.target.value as DaySettings["dinnerProtein"] })} disabled={busy || settings.snackOption === "romeuJulieta"}>
                        <option value="frangoOvo">Frango (100–110g) + 1 Ovo</option>
                        <option value="frangoPuro">Peito de Frango Puro (130g)</option>
                        <option value="carneMagra">Cortes Bovinos Magros (130–140g)</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Gatilho ergogênico na dobradinha */}
                {(settings.trainingMode === "dobradinha" || settings.workoutFocus === "treinoC") && (
                  <div className="builder-trigger-box">
                    <div className="trigger-box-title">
                      <Flame size={18} />
                      <strong>Gatilho Ergogênico (17h00) · Exclusivo Dobradinha / Pernas (~90 kcal)</strong>
                    </div>
                    <label>Opção de rápida absorção:
                      <select value={settings.triggerOption} onChange={(event) => updateSettings({ triggerOption: event.target.value as DaySettings["triggerOption"] })} disabled={busy}>
                        <option value="pacoca">1 Paçoca (20g) — 15 min antes do futevôlei</option>
                        <option value="banana">1 Banana Média (70g) — Carboidrato rápido</option>
                        <option value="azeitonas">6–8 Azeitonas + 350ml água (Bomba de Sódio / Pernas)</option>
                      </select>
                    </label>
                  </div>
                )}

                <div className="builder-footer">
                  <Clock3 size={16} />
                  <span>Janela alimentar: <strong>11h30 às 22h00</strong>. Não há ceia noturna. Jantar às 20h30 encerra a ingestão calórica.</span>
                </div>
              </section>

              <div className="section-heading standalone-heading">
                <div>
                  <span className="panel-kicker">PRESCRIÇÃO DIETÉTICA</span>
                  <h2>Refeições do Protocolo</h2>
                  <p>Total do plano: ~1.860 kcal (+90 kcal da paçoca na dobradinha = 1.950 kcal).</p>
                </div>
              </div>

              <div className="planned-meals-grid">
                {meals.map((meal) => {
                  const Icon = MEAL_STYLE[meal.slot]?.icon ?? UtensilsCrossed;
                  const registered = mealRegistered(meal.slot);
                  return (
                    <article className="panel planned-meal" key={meal.slot}>
                      <div className="planned-meal-top">
                        <div className={`meal-symbol ${MEAL_STYLE[meal.slot]?.color ?? "green"}`}><Icon size={21} /></div>
                        <div className="planned-meal-time"><Clock3 size={14} /> {meal.time}</div>
                      </div>
                      <span className="panel-kicker">{meal.tag}</span>
                      <h3>{meal.title}</h3>
                      <p>{meal.subtitle}</p>
                      <ul>{meal.ingredients.map((ing) => <li key={ing}>{ing}</li>)}</ul>
                      <div className="planned-meal-bottom">
                        <div><strong>{formatInt(meal.macros.calories)}</strong> kcal <span>· {formatInt(meal.macros.protein)}g prot.</span></div>
                        <button type="button" className={registered ? "round-action done" : "round-action"} onClick={() => { setSelectedSlot(meal.slot); setModal("plan"); }} aria-label={`Ver ${meal.title}`}>
                          {registered ? <Check size={18} /> : <Plus size={19} />}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <section className="panel diary-section">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">REGISTROS DO DIA</span>
                    <h2>Diário de Consumo</h2>
                    <p>Toque na lixeira para remover caso tenha clicado errado.</p>
                  </div>
                </div>
                {foods.length ? (
                  <div className="entry-list">
                    {foods.map((item) => {
                      const Icon = MEAL_STYLE[item.mealSlot]?.icon ?? UtensilsCrossed;
                      return (
                        <div className="entry-row" key={item.id}>
                          <span className="entry-icon"><Icon size={18} /></span>
                          <div className="entry-info">
                            <strong>{item.title}</strong>
                            <span>{MEAL_STYLE[item.mealSlot]?.label ?? "Extra"} · {formatInt(item.protein)}g prot • {formatInt(item.carbs)}g carbo • {formatInt(item.fat)}g gord</span>
                          </div>
                          <span className="entry-value">{formatInt(item.calories)} <small>kcal</small></span>
                          <button className="delete-button" type="button" disabled={busy} onClick={() => save("food", { id: item.id }, "DELETE", "Refeição removida com sucesso.")} title="Remover este registro" aria-label={`Remover ${item.title}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={UtensilsCrossed} title="Nenhuma refeição registrada hoje" text="Use o Assistente de Voz ('Almocei') ou clique nas refeições do plano acima." />
                )}
              </section>
            </div>

            <aside className="nutrition-side">
              <div className="panel nutrition-side-card">
                <div className="side-card-icon"><ShieldCheck size={21} /></div>
                <span className="panel-kicker">DIRETRIZES DO DOSSIÊ</span>
                <h3>Janela 11h30 às 22h00</h3>
                <p>Prescrição estruturada sem refeição de 22h. A ressíntese noturna acontece com o Jantar Recuperativo às 20h30.</p>
                <div className="side-card-rule">
                  <span>01</span>
                  <p><strong>Almoço Estrutural:</strong> 1,5L a 2,0L de água antes das 11h30. Vinagrete com ácido acético reduz pico glicêmico.</p>
                </div>
                <div className="side-card-rule">
                  <span>02</span>
                  <p><strong>Pré-Treino + Creatina:</strong> 5g de creatina todos os dias. Se optar por Romeu & Julieta (queijo), retire o ovo do jantar.</p>
                </div>
                <div className="side-card-rule">
                  <span>03</span>
                  <p><strong>Gatilho de Paçoca:</strong> Nos dias de dobradinha (musculação + futevôlei), 1 paçoca 15 min antes da areia estabiliza a glicemia.</p>
                </div>
                <div className="side-card-rule">
                  <span>04</span>
                  <p><strong>Jantar das 20h30:</strong> Ressíntese muscular noturna com carboidratos de alta absorção e 400ml de água.</p>
                </div>
              </div>

              <div className="side-green-card">
                <Leaf size={22} />
                <h3>Culinária e Meal Prep</h3>
                <p>Macaxeira cozida sem manteiga, arroz e cuscuz de milho. Frango desfiado na pressão com molho de tomate, cenoura e cebola.</p>
                <button type="button" onClick={() => navigate("guide")}>Ver Matriz de Trocas <ArrowRight size={16} /></button>
              </div>
            </aside>
          </div>
        </div>}

        {view === "training" && <div className="view-content training-view">
          <div className="training-mode-header">
            <div>
              <span className="panel-kicker">DIVISÃO ABCAB (5 DIAS) + AREIA</span>
              <h2>Sessão do Dia</h2>
            </div>
            <span>Periodização de Hipertrofia Superior e Blindagem Articular de Areia</span>
          </div>

          <div className="mode-selector">
            {MODE_OPTIONS.map((option) => {
              const Icon = option.key === "futevolei" ? Waves : option.key === "dobradinha" ? Zap : option.key === "descanso" ? Leaf : Dumbbell;
              return (
                <button type="button" key={option.key} className={settings.trainingMode === option.key ? "mode-chip selected" : "mode-chip"} onClick={() => updateSettings({ trainingMode: option.key })} disabled={busy}>
                  <Icon size={17} />{option.short}
                </button>
              );
            })}
          </div>

          <div className="training-layout">
            <div className="training-main">
              <div className="training-banner">
                <div className="training-banner-overlay" />
                <div className="training-banner-content">
                  <span><span className="banner-live-dot" /> DOSSIÊ DE TREINAMENTO ABCAB</span>
                  <h2>{settings.trainingMode === "descanso" ? "Recuperação Ativa & Mobilidade" : isGymDay ? getFocusLabel(settings.workoutFocus) : "Futevôlei (Treino na Areia)"}</h2>
                  <p>{settings.trainingMode === "dobradinha" ? "Sessão Dupla: Musculação com volume enxuto + Futevôlei com explosão na areia." : settings.trainingMode === "descanso" ? "Regeneração de glicogênio e preservação articular." : isGymDay ? getFocusSubtitle(settings.workoutFocus) : "Domínio, afundamento na areia e potência neuromuscular."}</p>
                </div>
              </div>

              {/* CARD DE FUTEVÔLEI OBJETIVO: apenas botão de registrar sem aba ou passos de academia */}
              {isSandDay && (
                <section className="panel sand-direct-card">
                  <div className="sand-direct-header">
                    <div className="sand-direct-icon"><Waves size={24} /></div>
                    <div className="sand-direct-info">
                      <span className="panel-kicker">SESSÃO NA AREIA</span>
                      <h2>Futevôlei</h2>
                      <p>Sessão prática na areia. Sustentação glicêmica com Paçoca 15 min antes e hidratação contínua.</p>
                    </div>
                  </div>
                  <div className="sand-direct-actions">
                    <div className="sand-duration-selector">
                      <label>Duração:</label>
                      <button type="button" className={sandDuration === "45" ? "active" : ""} onClick={() => setSandDuration("45")}>45 min</button>
                      <button type="button" className={sandDuration === "60" ? "active" : ""} onClick={() => setSandDuration("60")}>60 min</button>
                      <button type="button" className={sandDuration === "90" ? "active" : ""} onClick={() => setSandDuration("90")}>90 min</button>
                    </div>
                    {hasSandLog ? (
                      <div className="sand-logged-row">
                        <span className="sand-logged-badge"><CheckCircle2 size={16} /> Futevôlei registrado ({sandLogs[0].duration} min)</span>
                        <button type="button" className="sand-undo-btn" onClick={() => save("activity", { id: sandLogs[0].id }, "DELETE", "Registro de Futevôlei removido.")} title="Remover se clicou errado">
                          <Trash2 size={15} /> Remover registro
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="primary-button sand-register-btn" disabled={busy} onClick={() => registerSession("futevolei", "Futevôlei (Areia)", Number(sandDuration))}>
                        <Check size={18} /> Registrar Futevôlei ({sandDuration} min)
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* PROGRAMA DE MUSCULAÇÃO ABCAB COM EXERCÍCIOS SUBSTITUTOS DIRETOS */}
              {isGymDay && (
                <section className="panel workout-program">
                  <div className="section-heading">
                    <div>
                      <span className="panel-kicker">SELEÇÃO DA SÉRIE (ABCAB)</span>
                      <h2>{getFocusLabel(settings.workoutFocus)}</h2>
                      <p>{completedExercises} de {gymExercises.length} exercícios concluídos. Toque no botão de substituto para alternar.</p>
                    </div>
                    <span className="workout-duration"><Timer size={16} /> 35–40 min</span>
                  </div>

                  <div className="focus-selector">
                    {FOCUS_OPTIONS.map((focus) => (
                      <button key={focus.key} type="button" className={settings.workoutFocus === focus.key ? "focus-chip selected" : "focus-chip"} onClick={() => updateSettings({ workoutFocus: focus.key })} disabled={busy}>
                        {focus.short}
                      </button>
                    ))}
                  </div>

                  <div className="exercise-list">
                    {gymExercises.map((exercise, index) => {
                      const isSub = !!exerciseSubs[exercise.id];
                      const done = !!data?.exercises.some((entry) => entry.focus === settings.workoutFocus && entry.exerciseId === exercise.id);
                      return (
                        <div className={`exercise-card-item ${done ? "completed" : ""}`} key={exercise.id}>
                          <button type="button" className="exercise-check-btn" onClick={() => save("exercise", { focus: settings.workoutFocus, exerciseId: exercise.id, completed: !done })} disabled={busy} title="Marcar/Desmarcar">
                            <span className="exercise-check">{done ? <Check size={16} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</span>
                          </button>
                          <div className="exercise-main-info">
                            <div className="exercise-title-row">
                              <strong>{isSub ? `Substituto: ${exercise.substitute}` : exercise.name}</strong>
                              <span className="exercise-sets">{exercise.sets}</span>
                            </div>
                            <small className="exercise-biomech">{exercise.biomechanics}</small>

                            {/* Botão de Alternar Substituto Imediato */}
                            <div className="substitute-toggle-row">
                              <span className="sub-label"><RefreshCw size={12} /> Substituto Imediato do Dossiê:</span>
                              <button
                                type="button"
                                className={`sub-toggle-pill ${isSub ? "active" : ""}`}
                                onClick={() => setExerciseSubs((prev) => ({ ...prev, [exercise.id]: !prev[exercise.id] }))}
                                title="Alternar entre exercício principal e substituto"
                              >
                                {isSub ? "Usando Substituto (Ativo)" : `Trocar para: ${exercise.substitute}`}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="workout-program-bottom">
                    <span><Info size={15} /> Volume reduzido para alta intensidade sem sobrecarregar o futevôlei.</span>
                    <button type="button" className={hasGymLog ? "secondary-button completed-button" : "primary-button"} disabled={hasGymLog || busy} onClick={() => registerSession("musculacao", `Musculação (${getFocusLabel(settings.workoutFocus)})`, 40)}>
                      {hasGymLog ? <><CheckCircle2 size={17} /> Sessão Registrada</> : <><Check size={17} /> Concluir Sessão</>}
                    </button>
                  </div>
                </section>
              )}

              <section className="panel activity-history">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">FEITO HOJE</span>
                    <h2>Atividades Registradas</h2>
                  </div>
                  <button type="button" className="text-link" onClick={() => openActivity()}><Plus size={16} /> Adicionar manual</button>
                </div>
                {activities.length ? (
                  <div className="entry-list">
                    {activities.map((item: ActivityRecord) => (
                      <div className="entry-row" key={item.id}>
                        <span className="entry-icon activity"><Dumbbell size={18} /></span>
                        <div className="entry-info">
                          <strong>{item.label}</strong>
                          <span>{getModeLabel(item.type)} · {item.duration} min</span>
                        </div>
                        <span className="entry-value"><CheckCircle2 size={18} /></span>
                        <button className="delete-button" type="button" disabled={busy} onClick={() => save("activity", { id: item.id }, "DELETE", "Atividade removida.")} title="Remover atividade" aria-label={`Remover ${item.label}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Dumbbell} title="Nenhum treino anotado hoje" text="Use o microfone ('Treinei peito 40 min') ou conclua os exercícios acima." />
                )}
              </section>
            </div>

            <aside className="training-side">
              <div className="panel training-settings">
                <div className="settings-icon"><Clock3 size={21} /></div>
                <span className="panel-kicker">CRONOGRAMA</span>
                <h3>Horário de Treino</h3>
                <p>As refeições se ajustam ao seu horário de treinamento.</p>
                <label>Horário da sessão
                  <select value={settings.trainingTime} onChange={(event) => updateSettings({ trainingTime: event.target.value })} disabled={busy}>
                    <option value="17:00">17h00 · Fim da tarde</option>
                    <option value="19:00">19h00 · Início da noite</option>
                    <option value="20:30">20h30 · À noite</option>
                    <option value="21:00">21h00 · Tarde da noite</option>
                  </select>
                </label>
                <div className="timing-summary">
                  <div><span>PRÉ-TREINO</span><strong>14h45</strong></div>
                  <ArrowRight size={17} />
                  <div><span>JANTAR</span><strong>20h30</strong></div>
                </div>
              </div>

              <div className="panel training-hydration">
                <span className="panel-kicker">HIDRATAÇÃO DO DOSSIÊ</span>
                <div className="training-hydration-icon"><Droplets size={22} /></div>
                <h3>{formatDecimal(waterGoal / 1000, 1)} L de Água</h3>
                <p>{settings.trainingMode === "dobradinha" ? "Sessão dupla: meta de 4,0L para reposição eletrolítica completa na areia." : "Base clínica: 3,5L a 4,0L de água por dia."}</p>
                <div className="training-hydration-line"><span style={{ width: `${clampPercent(waterTotal, waterGoal)}%` }} /></div>
                <small>{formatInt(waterTotal)} ml de água registrados hoje</small>
              </div>

              {/* Card Creatina */}
              <div className={`panel supplement-card ${creatineTaken ? "taken" : ""}`}>
                <div className="supplement-top">
                  <div className="supplement-icon"><Pill size={21} /></div>
                  <div className="supplement-label">
                    <span className="panel-kicker">SUPLEMENTAÇÃO</span>
                    <strong>Creatina Monohidratada · 5 g</strong>
                  </div>
                  <button type="button" className={`toggle-switch ${creatineTaken ? "on" : ""}`} onClick={() => toggleCreatine()} disabled={busy} aria-pressed={creatineTaken} aria-label={creatineTaken ? "Desmarcar creatina" : "Marcar creatina como tomada"}>
                    <span />
                  </button>
                </div>
                <p>{creatineTaken ? "Creatina de 5g tomada hoje!" : "Marque aqui quando tomar seus 5g de Creatina."}</p>
                {creatineTaken && <span className="supplement-check"><CheckCircle2 size={14} /> Tomada hoje</span>}
              </div>

              <div className="training-tip">
                <Sparkles size={18} />
                <p>Na Divisão ABCAB, o Treino C (Pernas) é enxuto e tem Zero Stiff para blindar os joelhos e prevenir fadiga no futevôlei.</p>
              </div>
            </aside>
          </div>
        </div>}

        {view === "progress" && <div className="view-content progress-view">
          {/* PAINEL DE BALANÇO ENERGÉTICO & TAXA BASAL */}
          <section className="panel metabolic-panel">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">ARQUITETURA METABÓLICA (DOSSIÊ CLÍNICO)</span>
                <h2>Taxa Basal & Metas Energéticas</h2>
                <p>Equilíbrio térmico e déficit controlado para recomposição corporal sem perda de glicogênio.</p>
              </div>
              <div className="metabolic-badge"><ShieldCheck size={16} /> Déficit Controlado: -500 kcal</div>
            </div>
            <div className="metabolic-grid">
              <div className="metabolic-item">
                <span className="metabolic-label">Taxa Metabólica Basal (TMB)</span>
                <strong>{METABOLIC_STATS.bmr} <small>kcal/dia</small></strong>
                <p>Gasto energético vital de repouso dos órgãos e síntese proteica.</p>
              </div>
              <div className="metabolic-item">
                <span className="metabolic-label">Gasto Total Estimado (TDEE)</span>
                <strong>{METABOLIC_STATS.tdee} <small>kcal/dia</small></strong>
                <p>Gasto com rotina atlética híbrida (Musculação + Futevôlei).</p>
              </div>
              <div className="metabolic-item highlight">
                <span className="metabolic-label">Meta Calórica da Dieta</span>
                <strong>{METABOLIC_STATS.dietGoal} <small>kcal/dia</small></strong>
                <p>Déficit planejado com 140g de proteína para preservar massa magra.</p>
              </div>
              <div className="metabolic-item">
                <span className="metabolic-label">Déficit Diário Planejado</span>
                <strong>-500 <small>kcal/dia</small></strong>
                <p>Recomposição gradual de gordura sem perda de força ou fadiga.</p>
              </div>
            </div>
          </section>

          <div className="progress-layout">
            <div className="progress-main">
              {/* COMPARATIVO DE PESO: ATUAL VS. ANTERIOR & DIA OFICIAL DE PESAGEM */}
              <section className="panel weighin-comparison-panel">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">ACOMPANHAMENTO DE PESO & EVOLUÇÃO</span>
                    <h2>Peso Atual vs. Anterior</h2>
                    <p>Pesagens em jejum pela manhã para acompanhamento fidedigno.</p>
                  </div>
                  <button className="primary-button" type="button" onClick={openWeight}><Plus size={16} /> Registrar Medidas</button>
                </div>

                <div className="weighin-summary-grid">
                  <div className="weighin-card current">
                    <span className="weighin-card-label">PESO ATUAL (MAIS RECENTE)</span>
                    <strong>{latestWeight ? `${formatDecimal(latestWeight.weight, 1)} kg` : "— kg"}</strong>
                    <small>{latestWeight ? `Registrado em ${formatDay(latestWeight.day, { day: "numeric", month: "short" })}` : "Nenhum peso cadastrado"}</small>
                  </div>

                  <div className="weighin-card previous">
                    <span className="weighin-card-label">PESO ANTERIOR</span>
                    <strong>{previousWeight ? `${formatDecimal(previousWeight.weight, 1)} kg` : "— kg"}</strong>
                    <small>{previousWeight ? `Registrado em ${formatDay(previousWeight.day, { day: "numeric", month: "short" })}` : "Sem pesagem anterior"}</small>
                  </div>

                  <div className={`weighin-card delta ${weightDelta !== null && weightDelta <= 0 ? "loss" : weightDelta !== null ? "gain" : ""}`}>
                    <span className="weighin-card-label">VARIAÇÃO (DELTA)</span>
                    <strong>
                      {weightDelta !== null ? (
                        <>
                          {weightDelta <= 0 ? <ArrowDown size={22} /> : <ArrowUp size={22} />}
                          {formatDecimal(Math.abs(weightDelta), 1)} kg
                        </>
                      ) : (
                        "—"
                      )}
                    </strong>
                    <small>{weightDelta !== null && weightDelta <= 0 ? "Tendência favorável de recomposição" : weightDelta !== null ? "Variação hídrica ou muscular" : "Aguardando próxima pesagem"}</small>
                  </div>
                </div>

                {/* DIA OFICIAL DE PESAGEM SEMANAL */}
                <div className={`weighin-day-banner ${isOfficialWeighDay ? "is-today" : ""}`}>
                  <div className="weighin-day-icon"><Scale size={20} /></div>
                  <div className="weighin-day-copy">
                    <strong>
                      {isOfficialWeighDay ? "🚨 Hoje é o seu dia oficial de pesagem semanal!" : `Dia oficial de pesagem na semana: ${WEIGH_DAYS.find((d) => d.key === settings.weighInDay)?.label ?? "Domingo"}`}
                    </strong>
                    <p>
                      {isOfficialWeighDay
                        ? "Pese em jejum pela manhã, após esvaziar a bexiga, para uma comparação padronizada semana a semana."
                        : "Padronize a pesagem semanal no mesmo dia em jejum para neutralizar variações hídricas do futevôlei."}
                    </p>
                  </div>
                  <div className="weighin-day-selector">
                    <label>Trocar dia oficial:</label>
                    <select value={settings.weighInDay} onChange={(e) => updateSettings({ weighInDay: e.target.value })} disabled={busy}>
                      {WEIGH_DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* GRÁFICO SEMANAL DE CALORIAS */}
              <section className="panel progress-chart-panel">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">CONSISTÊNCIA SEMANAL</span>
                    <h2>Aderência Energética (1.950 kcal)</h2>
                    <p>{formatDay(history[0].day, { day: "numeric", month: "short" })} — {formatDay(history[6].day, { day: "numeric", month: "short" })} · toque em um dia para inspecionar.</p>
                  </div>
                  <span className="chart-legend"><span /> kcal consumidas</span>
                </div>
                <WeeklyBars history={history} onPick={pickHistoryDay} />
              </section>

              <section className="panel history-panel">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">REGISTRO HISTÓRICO</span>
                    <h2>Dia a dia</h2>
                  </div>
                  <button className="outline-button" type="button" onClick={exportHistory}><Download size={16} /> Exportar CSV</button>
                </div>
                <div className="history-table">
                  <div className="history-head"><span>DATA</span><span>CALORIAS</span><span>PROTEÍNA</span><span>ÁGUA</span><span>TREINOS</span></div>
                  {[...history].reverse().map((item) => (
                    <button type="button" className="history-row" key={item.day} onClick={() => pickHistoryDay(item.day)}>
                      <span><strong>{formatDay(item.day, { weekday: "short", day: "numeric", month: "short" })}</strong>{item.day === localDay() && <small>Hoje</small>}</span>
                      <span>{item.calories ? `${formatInt(item.calories)} kcal` : "—"}</span>
                      <span>{item.protein ? `${formatInt(item.protein)} g` : "—"}</span>
                      <span>{item.water ? `${formatDecimal(item.water / 1000, 1)} L` : "—"}</span>
                      <span>{item.workouts ? `${item.workouts} sessão${item.workouts > 1 ? "ões" : ""}` : "—"}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="progress-side">
              {/* PAINEL DE MEDIDAS CORPORAIS COMPLETAS */}
              <div className="panel body-measurements-panel">
                <div className="section-heading">
                  <div>
                    <span className="panel-kicker">BIOMETRIA COMPLETA</span>
                    <h3>Medidas Corporais</h3>
                  </div>
                  <button className="icon-btn" type="button" onClick={openWeight} title="Atualizar medidas"><Ruler size={18} /></button>
                </div>
                <p className="side-panel-desc">Acompanhamento de perímetro para avaliar hipertrofia de tronco e queima de gordura abdominal.</p>

                <div className="measurements-display-list">
                  <div className="meas-item">
                    <span>Peso</span>
                    <strong>{data?.measurement?.weight ? `${formatDecimal(data.measurement.weight, 1)} kg` : "—"}</strong>
                  </div>
                  <div className="meas-item">
                    <span>Cintura</span>
                    <strong>{data?.measurement?.waist ? `${formatDecimal(data.measurement.waist, 1)} cm` : "—"}</strong>
                  </div>
                  <div className="meas-item">
                    <span>Tórax / Peitoral</span>
                    <strong>{data?.measurement?.chest ? `${formatDecimal(data.measurement.chest, 1)} cm` : "—"}</strong>
                  </div>
                  <div className="meas-item">
                    <span>Braço / Bíceps</span>
                    <strong>{data?.measurement?.arms ? `${formatDecimal(data.measurement.arms, 1)} cm` : "—"}</strong>
                  </div>
                  <div className="meas-item">
                    <span>Coxa</span>
                    <strong>{data?.measurement?.thighs ? `${formatDecimal(data.measurement.thighs, 1)} cm` : "—"}</strong>
                  </div>
                  <div className="meas-item">
                    <span>Quadril</span>
                    <strong>{data?.measurement?.hips ? `${formatDecimal(data.measurement.hips, 1)} cm` : "—"}</strong>
                  </div>
                </div>

                <button className="primary-button meas-update-btn" type="button" onClick={openWeight}>
                  <Plus size={16} /> {data?.measurement ? "Atualizar medidas" : "Cadastrar medidas de hoje"}
                </button>
              </div>

              <div className="panel weight-trend">
                <div className="section-heading"><div><span className="panel-kicker">TENDÊNCIA (30 DIAS)</span><h3>Evolução do Peso</h3></div></div>
                {data?.measurementHistory && data.measurementHistory.length >= 2 ? (() => {
                  const list = data.measurementHistory;
                  const min = Math.min(...list.map((item) => item.weight)) - 1;
                  const max = Math.max(...list.map((item) => item.weight)) + 1;
                  const points = list.map((item, index) => `${20 + (index * 260) / (list.length - 1)},${90 - ((item.weight - min) / (max - min)) * 70}`).join(" ");
                  return (
                    <>
                      <svg className="weight-svg" viewBox="0 0 300 110" preserveAspectRatio="none" aria-label="Gráfico de tendência de peso">
                        <line x1="0" y1="93" x2="300" y2="93" stroke="#35453d" strokeDasharray="4 5" />
                        <polyline points={points} fill="none" stroke="#d1f56c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {list.map((item, index) => <circle key={item.day} cx={20 + (index * 260) / (list.length - 1)} cy={90 - ((item.weight - min) / (max - min)) * 70} r="4" fill="#d1f56c" />)}
                      </svg>
                      <div className="weight-axis">
                        <span>{formatDay(list[0].day, { day: "numeric", month: "short" })}</span>
                        <span>{formatDay(list[list.length - 1].day, { day: "numeric", month: "short" })}</span>
                      </div>
                    </>
                  );
                })() : (
                  <div className="weight-empty"><TrendingUp size={25} /><span>Registre peso em pelo menos dois dias para ver a curva.</span></div>
                )}
              </div>

              <div className="progress-reminder">
                <HeartPulse size={21} />
                <p>O déficit controlado (1.950 kcal) com 140g de proteína garante recomposição sem perda de glicogênio na areia.</p>
              </div>
            </aside>
          </div>
        </div>}

        {view === "guide" && <div className="view-content guide-view">
          <section className="guide-hero">
            <div>
              <span className="guide-eyebrow"><Sparkles size={16} /> DOSSIÊ DE PERFORMANCE E RECOMPOSIÇÃO</span>
              <h2>Protocolo Híbrido: Musculação (ABCAB) + Futevôlei</h2>
              <p>Otimização de custo, culinária regional nordestina e biodisponibilidade de nutrientes.</p>
            </div>
            <div className="guide-hero-target">
              <Target size={29} />
              <strong>1.950</strong>
              <span>kcal / dia</span>
            </div>
          </section>

          <div className="guide-target-grid">
            <div><span>01 / CARBOIDRATOS (47%)</span><strong>228 g</strong><p>~912 kcal • Energia para futevôlei e hipertrofia.</p></div>
            <div><span>02 / PROTEÍNAS (28%)</span><strong>140 g</strong><p>~560 kcal • 1,75g/kg • Síntese proteica máxima.</p></div>
            <div><span>03 / LIPÍDIOS (25%)</span><strong>54 g</strong><p>~486 kcal • Suporte hormonal e controle de azeite.</p></div>
            <div><span>04 / HIDRATAÇÃO BASE</span><strong>3,5L–4,0L</strong><p>1,5L a 2,0L antes das 11h30 e 400ml no jantar.</p></div>
          </div>

          <div className="guide-grid">
            <section className="panel guide-section">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">TABELA DE TROCAS DIRETAS</span>
                  <h2>Grupo A: Carboidratos (~45g a 50g Carbo)</h2>
                  <p>Pesos pesados prontos/cozidos sem manteiga.</p>
                </div>
                <UtensilsCrossed size={23} className="section-decoration" />
              </div>
              <div className="swap-list">
                <div className="swap-row"><span>Macaxeira / Aipim Cozido</span><strong>180 g (3 a 4 pedaços médios)</strong></div>
                <div className="swap-row"><span>Cuscuz de Milho (Flocão)</span><strong>140g a 150g simples (ou 165g recheado s/ azeite)</strong></div>
                <div className="swap-row"><span>Arroz Branco ou Parboilizado</span><strong>160 g (5 colheres de sopa cheias)</strong></div>
                <div className="swap-row"><span>Macarrão Cozido</span><strong>160g a 180g</strong></div>
                <div className="swap-row"><span>Pão Francês ou de Forma</span><strong>100g (2 un) ou 4 fatias de forma</strong></div>
                <div className="swap-row"><span>Goma de Tapioca</span><strong>85g (4 a 5 colheres rasas)</strong></div>
                <div className="swap-row"><span>Batata Inglesa / Doce</span><strong>240g inglesa ou 200g batata doce</strong></div>
              </div>
            </section>

            <section className="panel guide-section">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">TABELA DE TROCAS DIRETAS</span>
                  <h2>Grupo B: Proteínas (~42g a 46g Prot)</h2>
                  <p>Alto valor biológico para almoço ou jantar.</p>
                </div>
                <ShieldCheck size={23} className="section-decoration" />
              </div>
              <div className="swap-list">
                <div className="swap-row"><span>Peito de Frango + 1 Ovo</span><strong>100g a 110g frango + 1 ovo inteiro (Padrão mais econômico)</strong></div>
                <div className="swap-row"><span>Peito de Frango Puro</span><strong>150g (Almoço) ou 140g (Jantar sem ovo)</strong></div>
                <div className="swap-row"><span>Cortes Bovinos Magros</span><strong>130g a 140g (Patinho, Músculo ou Acém magro)</strong></div>
                <div className="swap-row"><span>Lombo Suíno</span><strong>140g</strong></div>
                <div className="swap-row"><span>Atum + Ovos</span><strong>1 lata atum + 2 ovos inteiros (zerar azeite)</strong></div>
              </div>
            </section>

            <section className="panel guide-section">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">CRONONUTRIÇÃO CLÍNICA</span>
                  <h2>Refeições & Gatilho de Paçoca</h2>
                  <p>Sem ceia de 22h. Janela estrita de 11h30 às 22h00.</p>
                </div>
                <Clock3 size={23} className="section-decoration" />
              </div>
              <div className="guide-steps">
                <div>
                  <span>01</span>
                  <p><strong>11h30 · Almoço Estrutural (~640 kcal • 48g Prot):</strong> Carbo base + Proteína + Vinagrete à vontade + 5ml de azeite (se não usar ovo). 1,5L a 2,0L de água pela manhã.</p>
                </div>
                <div>
                  <span>02</span>
                  <p><strong>14h45 · Pré-Treino (~390 kcal • 32g Prot):</strong> Aveia (40g) + Whey (30g) + Fruta. Ou Protocolo Romeu & Julieta (Pão, queijo 30g, goiabada 25g, whey e morangos). Adicionar 5g de Creatina.</p>
                </div>
                <div>
                  <span>03</span>
                  <p><strong>17h00 · Gatilho Ergogênico (~90 kcal):</strong> Exclusivo para dia de sessão dupla (Musculação + Futevôlei) ou treino de pernas. 1 Paçoca (20g) ou 1 Banana média 15 min antes da areia.</p>
                </div>
                <div>
                  <span>04</span>
                  <p><strong>20h30 · Jantar Recuperativo (~830 kcal • 58g Prot):</strong> Macaxeira/Cuscuz/Arroz/Pão + Frango/Carne. Ressíntese noturna com 400ml de água. Encerra a janela alimentar.</p>
                </div>
              </div>
            </section>

            <section className="panel guide-section">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">DIVISÃO ABCAB (5 DIAS)</span>
                  <h2>Periodização de Treinamento</h2>
                  <p>Volume reduzido para hipertrofia sem desgaste articular.</p>
                </div>
                <Dumbbell size={24} className="section-decoration" />
              </div>
              <div className="guide-steps">
                <div>
                  <span>A</span>
                  <p><strong>Segunda & Quinta · Treino A (Peito, Ombro & Tríceps):</strong> 18 séries • 35–40 min. Supino inclinado c/ halteres (subst: Smith), supino reto (subst: halteres), peck deck (subst: crossover), desenvolvimento, elevação lateral, tríceps corda + francês.</p>
                </div>
                <div>
                  <span>B</span>
                  <p><strong>Terça & Sexta · Treino B (Costas, Trapézio, Post & Bíceps):</strong> 16 séries • 35–40 min. Puxada alta aberta (subst: triângulo), remada baixa triângulo, remada serrote (subst: cavalinho), crucifixo inverso, rosca direta W + martelo.</p>
                </div>
                <div>
                  <span>C</span>
                  <p><strong>Quarta · Treino C (Pernas Enxuto - Blindagem Areia):</strong> 15 séries • 35 min • Zero Stiff. Leg press 45° (subst: Hack), cadeira extensora (1s no topo), mesa flexora deitada, cadeira flexora opcional.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Card de Instalação no iPhone */}
          <section className="panel pwa-ios-card">
            <div className="pwa-ios-header">
              <div className="pwa-ios-icon"><Smartphone size={24} /></div>
              <div>
                <span className="panel-kicker">INSTALAÇÃO NO IPHONE</span>
                <h2>Como Usar Como App no seu iPhone 14</h2>
                <p>O <strong>pulso.</strong> é configurado como Progressive Web App (PWA). Você instala direto pelo Safari sem precisar da App Store.</p>
              </div>
            </div>
            <div className="pwa-steps-grid">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <div>
                  <strong>Abra no Safari</strong>
                  <p>Acesse o link do app usando o navegador <strong>Safari</strong> no seu iPhone 14 (não use o Chrome no iOS).</p>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <div>
                  <strong>Toque em Compartilhar</strong>
                  <p>Na barra inferior do Safari, toque no botão de compartilhar <Share2 size={13} style={{ display: "inline", verticalAlign: "middle" }} /> (o quadrado com uma seta para cima).</p>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">3</span>
                <div>
                  <strong>Adicionar à Tela de Início</strong>
                  <p>Role o menu para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong> (ou <em>"Add to Home Screen"</em>).</p>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">4</span>
                <div>
                  <strong>Toque em "Adicionar"</strong>
                  <p>O ícone escuro do <strong>pulso.</strong> aparecerá na sua tela inicial como qualquer app nativo, em tela cheia e sem barras do navegador!</p>
                </div>
              </div>
            </div>
          </section>

          <div className="guide-disclaimer">
            <Info size={17} />
            <span>Prescrição baseada no Dossiê Clínico de Nutrição & Performance Esportiva do atleta. Pesos e medidas referem-se a alimentos prontos para consumo.</span>
          </div>
        </div>}

        <footer className="main-footer">
          <span>pulso<span className="footer-dot">.</span> <span className="footer-separator">/</span> dossiê clínico ativo</span>
          <span>1.950 kcal • 140g proteína • 3,5L a 4,0L água</span>
        </footer>
      </main>

      {/* FAB Mobile exclusivo de Voz */}
      <button className="mobile-voice-fab" type="button" onClick={() => setModal("chat")} aria-label="Falar por voz"><Mic size={24} /></button>

      <nav className="mobile-nav" aria-label="Navegação mobile">
        {NAV.slice(0, 4).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={view === id ? "selected" : ""} onClick={() => navigate(id)}>
            <Icon size={21} strokeWidth={view === id ? 2.3 : 1.9} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {toast && (
        <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status">
          {toast.error ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Fechar aviso"><X size={15} /></button>
        </div>
      )}

      {/* Modais */}
      {modal && (
        <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Detalhes">
            <div className="modal-header">
              <div>
                <span className="panel-kicker">
                  {modal === "plan" ? "DOSSIÊ CLÍNICO" : modal === "chat" ? "ASSISTENTE DE VOZ & TEXTO" : modal === "activity" ? "REGISTRO DE TREINO" : "BIOMETRIA CORPORAL"}
                </span>
                <h2>
                  {modal === "plan" ? "Refeição Prescrita" : modal === "chat" ? "Falar o que fez" : modal === "activity" ? "Registrar atividade" : "Medidas & Peso"}
                </h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setModal(null)} aria-label="Fechar"><X size={20} /></button>
            </div>

            {/* Modal Chat / Voz */}
            {modal === "chat" && (
              <div className="modal-body chat-modal-body">
                <p className="modal-description">Fale ou digite naturalmente o que você fez. O assistente identifica e contabiliza imediatamente no seu dia!</p>

                <div className="chat-suggestions">
                  <span className="suggestions-title">Exemplos para tocar e enviar:</span>
                  <div className="suggestions-chips">
                    <button type="button" onClick={() => void sendChatMessage("Almocei, e bebi 1 litro e 200 de agua")}>"Almocei, e bebi 1.2L de água"</button>
                    <button type="button" onClick={() => void sendChatMessage("Bebi 126ml de água")}>"Bebi 126ml de água"</button>
                    <button type="button" onClick={() => void sendChatMessage("Comi uma paçoca")}>"Comi uma paçoca"</button>
                    <button type="button" onClick={() => void sendChatMessage("Tomei a creatina e bebi 500ml")}>"Tomei creatina e 500ml"</button>
                    <button type="button" onClick={() => void sendChatMessage("Fiz o pré-treino")}>"Fiz o pré-treino"</button>
                    <button type="button" onClick={() => void sendChatMessage("Jantei e bebi 400ml de água")}>"Jantei e bebi 400ml"</button>
                    <button type="button" onClick={() => void sendChatMessage("Treinei peito 40 minutos")}>"Treinei peito 40 min"</button>
                    <button type="button" onClick={() => void sendChatMessage("Joguei futevôlei 1h")}>"Joguei futevôlei 1h"</button>
                  </div>
                </div>

                <div className="chat-history-box">
                  {chatMessagesList.length === 0 ? (
                    <div className="chat-empty">
                      <Mic size={28} />
                      <p>Toque no microfone abaixo ou digite o que você consumiu.</p>
                      <small>Exemplo: "almocei, e bebi 1 litro e 200 de agua"</small>
                    </div>
                  ) : (
                    chatMessagesList.map((msg) => (
                      <div key={msg.id} className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                        <strong>{msg.role === "user" ? "Você" : "Pulso Coach"}</strong>
                        <p>{msg.text}</p>
                        {msg.actionsSummary && <span className="action-tag"><Check size={12} /> {msg.actionsSummary}</span>}
                      </div>
                    ))
                  )}
                </div>

                <form className="chat-input-bar" onSubmit={(e) => { e.preventDefault(); void sendChatMessage(); }}>
                  <button type="button" className={`chat-mic-btn ${isListening ? "listening" : ""}`} onClick={isListening ? stopListening : startListening} title={isListening ? "Parar gravação" : "Falar por voz"} aria-label="Microfone">
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <input type="text" placeholder={isListening ? "Ouvindo sua voz..." : "Digite ou fale o que você fez..."} value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={chatSending} autoFocus />
                  <button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || chatSending} aria-label="Enviar">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

            {/* Modal Refeição do Plano */}
            {modal === "plan" && selectedMeal && (
              <div className="modal-body">
                <div className="modal-meal-heading">
                  <div className={`meal-symbol ${MEAL_STYLE[selectedMeal.slot]?.color ?? "green"}`}>
                    {(() => { const Icon = MEAL_STYLE[selectedMeal.slot]?.icon ?? UtensilsCrossed; return <Icon size={22} />; })()}
                  </div>
                  <div>
                    <span>{selectedMeal.time} · {selectedMeal.tag}</span>
                    <h3>{selectedMeal.title}</h3>
                  </div>
                </div>
                <p className="modal-description">{selectedMeal.subtitle}</p>
                <div className="modal-clinical-note"><Info size={15} /><span>{selectedMeal.clinicalNote}</span></div>
                <ul className="modal-ingredients">{selectedMeal.ingredients.map((ing) => <li key={ing}>{ing}</li>)}</ul>
                <div className="modal-macros">
                  <div><strong>{formatInt(selectedMeal.macros.calories)}</strong><span>kcal</span></div>
                  <div><strong>{formatInt(selectedMeal.macros.protein)}g</strong><span>proteína</span></div>
                  <div><strong>{formatInt(selectedMeal.macros.carbs)}g</strong><span>carbo</span></div>
                  <div><strong>{formatInt(selectedMeal.macros.fat)}g</strong><span>gorduras</span></div>
                </div>

                {mealRegistered(selectedMeal.slot) ? (
                  <div className="modal-plan-actions">
                    <button type="button" className="primary-button modal-submit" onClick={() => setModal(null)}><CheckCircle2 size={18} /> Já está registrada</button>
                    <button type="button" className="modal-delete modal-delete-block" disabled={busy} onClick={async () => {
                      const entry = foods.find((item) => item.mealSlot === selectedMeal.slot && item.source === "plan");
                      if (entry) {
                        const okay = await save("food", { id: entry.id }, "DELETE", "Refeição removida do dia.");
                        if (okay) setModal(null);
                      }
                    }}>
                      <Trash2 size={15} /> Remover este registro (cliquei errado)
                    </button>
                  </div>
                ) : (
                  <button type="button" className="primary-button modal-submit" onClick={() => registerMeal(selectedMeal)} disabled={busy}>
                    <Plus size={18} /> Registrar esta refeição
                  </button>
                )}
              </div>
            )}

            {/* Modal Atividade */}
            {modal === "activity" && (
              <form className="modal-body form-stack" onSubmit={submitActivity}>
                <p className="modal-description">Registre sua sessão de musculação ou futevôlei.</p>
                <label>Modalidade
                  <select value={activityForm.type} onChange={(event) => {
                    const type = event.target.value as TrainingMode;
                    setActivityForm({ ...activityForm, type, label: type === "futevolei" ? "Futevôlei (Areia)" : "Musculação (Treino A)" });
                  }}>
                    <option value="musculacao">Musculação (ABCAB)</option>
                    <option value="futevolei">Futevôlei (Areia)</option>
                  </select>
                </label>
                <label>Nome do treino
                  <input type="text" maxLength={100} value={activityForm.label} onChange={(event) => setActivityForm({ ...activityForm, label: event.target.value })} required />
                </label>
                <label>Duração (minutos)
                  <input type="number" min="1" max="600" value={activityForm.duration} onChange={(event) => setActivityForm({ ...activityForm, duration: event.target.value })} required />
                </label>
                <button className="primary-button modal-submit" type="submit" disabled={busy}><Check size={18} /> Salvar atividade</button>
              </form>
            )}

            {/* Modal Peso & Medidas Corporais Completas */}
            {modal === "weight" && (
              <form className="modal-body form-stack" onSubmit={submitWeight}>
                <p className="modal-description">Acompanhe seu peso e medidas corporais completas em jejum pela manhã.</p>

                <div className="form-grid">
                  <label>Peso (kg) *
                    <input type="number" min="30" max="300" step="0.1" placeholder="Ex.: 75.8" value={weightForm.weight} onChange={(event) => setWeightForm({ ...weightForm, weight: event.target.value })} required autoFocus />
                  </label>
                  <label>Cintura (cm)
                    <input type="number" min="30" max="200" step="0.1" placeholder="Ex.: 82.0" value={weightForm.waist} onChange={(event) => setWeightForm({ ...weightForm, waist: event.target.value })} />
                  </label>
                  <label>Tórax / Peitoral (cm)
                    <input type="number" min="30" max="200" step="0.1" placeholder="Ex.: 104.5" value={weightForm.chest} onChange={(event) => setWeightForm({ ...weightForm, chest: event.target.value })} />
                  </label>
                  <label>Braço / Bíceps (cm)
                    <input type="number" min="15" max="100" step="0.1" placeholder="Ex.: 38.0" value={weightForm.arms} onChange={(event) => setWeightForm({ ...weightForm, arms: event.target.value })} />
                  </label>
                  <label>Coxa (cm)
                    <input type="number" min="20" max="150" step="0.1" placeholder="Ex.: 58.0" value={weightForm.thighs} onChange={(event) => setWeightForm({ ...weightForm, thighs: event.target.value })} />
                  </label>
                  <label>Quadril (cm)
                    <input type="number" min="30" max="200" step="0.1" placeholder="Ex.: 98.0" value={weightForm.hips} onChange={(event) => setWeightForm({ ...weightForm, hips: event.target.value })} />
                  </label>
                </div>

                <button className="primary-button modal-submit" type="submit" disabled={busy}><Check size={18} /> Salvar biometria</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}