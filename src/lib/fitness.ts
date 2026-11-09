export const GOALS = { calories: 1950, protein: 140, carbs: 228, fat: 54 } as const;
export type TrainingMode = "musculacao" | "futevolei" | "dobradinha" | "descanso";
export type FocusKey = "treinoA" | "treinoB" | "treinoC";
export type CarbKey = "arroz" | "macarrao" | "macaxeira" | "cuscuz" | "tapioca" | "pao" | "batata";
export type ProteinKey = "frangoPuro" | "carneMagra" | "frangoOvo" | "lomboAtum";
export type SnackKey = "iogurteWhey" | "romeuJulieta" | "paoFrango";
export type TriggerKey = "pacoca" | "banana" | "azeitonas";
export type MealSlot = "almoco" | "lanche" | "gatilho" | "jantar" | "extra";
export type Macros = { calories: number; protein: number; carbs: number; fat: number };

export type DaySettings = {
  trainingMode: TrainingMode;
  trainingTime: string;
  workoutFocus: FocusKey;
  lunchCarb: CarbKey;
  lunchProtein: ProteinKey;
  snackOption: SnackKey;
  triggerOption: TriggerKey;
  dinnerCarb: CarbKey;
  dinnerProtein: ProteinKey;
  weighInDay: string;
};

export const DEFAULT_SETTINGS: DaySettings = {
  trainingMode: "musculacao",
  trainingTime: "17:00",
  workoutFocus: "treinoA",
  lunchCarb: "arroz",
  lunchProtein: "frangoPuro",
  snackOption: "iogurteWhey",
  triggerOption: "pacoca",
  dinnerCarb: "macaxeira",
  dinnerProtein: "frangoPuro",
  weighInDay: "domingo",
};

// Metas operacionais conforme Ficha Técnica RAG (Luciano - Protocolo TG)
export function getCaloriesGoal(mode: TrainingMode): number {
  if (mode === "dobradinha") return 1950; // Dia de Alta Demanda (Treino Duplo)
  if (mode === "musculacao" || mode === "futevolei") return 1825; // Demanda Moderada (Treino Único)
  return 1720; // Dia de Descanso (Base)
}

export const METABOLIC_STATS = {
  bmr: 1730,
  tdee: 2450,
  dietGoal: 1950,
  deficit: 500,
};

export const WEIGH_DAYS = [
  { key: "domingo", label: "Domingo" },
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
];

export type FoodRecord = Macros & { id: number; day: string; mealSlot: MealSlot; title: string; details: string | null; source: string; createdAt: string };
export type WaterRecord = { id: number; day: string; amount: number; createdAt: string };
export type ActivityRecord = { id: number; day: string; type: TrainingMode; label: string; duration: number; createdAt: string };
export type ExerciseRecord = { id: number; day: string; focus: FocusKey; exerciseId: string; completed: boolean };
export type SupplementRecord = { id: number; day: string; name: string; amount: string; taken: boolean; createdAt: string };
export type MeasurementRecord = {
  id: number;
  day: string;
  weight: number;
  waist: number | null;
  chest: number | null;
  arms: number | null;
  thighs: number | null;
  hips: number | null;
  createdAt: string;
};
export type ChatRecord = { id: number; day: string; role: string; text: string; actionsSummary: string | null; createdAt: string };
export type HistoryPoint = { day: string; calories: number; protein: number; carbs: number; fat: number; water: number; workouts: number; weight: number | null };

export type DayData = {
  settings: DaySettings;
  foods: FoodRecord[];
  waters: WaterRecord[];
  activities: ActivityRecord[];
  exercises: ExerciseRecord[];
  supplements: SupplementRecord[];
  measurement: MeasurementRecord | null;
  measurementHistory: MeasurementRecord[];
  chatHistory: ChatRecord[];
  history: HistoryPoint[];
};

export const MODE_OPTIONS: { key: TrainingMode; label: string; short: string }[] = [
  { key: "musculacao", label: "Musculação (ABCAB)", short: "Musculação" },
  { key: "futevolei", label: "Futevôlei (Areia)", short: "Futevôlei" },
  { key: "dobradinha", label: "Sessão Dupla (Força + Areia)", short: "Dobradinha" },
  { key: "descanso", label: "Descanso Ativo / Regenerativo", short: "Descanso" },
];

export const FOCUS_OPTIONS: { key: FocusKey; label: string; short: string; subtitle: string }[] = [
  { key: "treinoA", label: "Treino A – Peito, Ombro & Tríceps", short: "Treino A", subtitle: "18 séries · 40 min · Volume Reduzido" },
  { key: "treinoB", label: "Treino B – Costas, Post & Bíceps", short: "Treino B", subtitle: "16 séries · 40 min · Volume Reduzido" },
  { key: "treinoC", label: "Treino C – Pernas Enxuto (Blindagem Areia)", short: "Treino C", subtitle: "15 séries · 35 min · Zero Stiff" },
];

// OPÇÕES DE CARBOIDRATO AJUSTADAS PROTOCOLO TG
export const CARB_OPTIONS: Record<CarbKey, { label: string; amount: string; macros: Macros }> = {
  arroz: { label: "Arroz Branco / Integral", amount: "120 g", macros: { calories: 156, protein: 3.2, carbs: 33.7, fat: 0.3 } },
  macarrao: { label: "Macarrão Cozido", amount: "120 g", macros: { calories: 187, protein: 6.8, carbs: 36.9, fat: 1.0 } },
  macaxeira: { label: "Macaxeira Cozida / Inhame", amount: "120 g", macros: { calories: 150, protein: 0.7, carbs: 36.1, fat: 0.3 } },
  cuscuz: { label: "Cuscuz Simples (Hidratado)", amount: "120 g", macros: { calories: 134, protein: 2.6, carbs: 30.4, fat: 0.8 } },
  tapioca: { label: "Goma de Tapioca", amount: "60 g", macros: { calories: 144, protein: 0.1, carbs: 35.4, fat: 0.1 } },
  pao: { label: "Pão de Forma Integral (2 fatias)", amount: "50 g", macros: { calories: 135, protein: 4.4, carbs: 27.0, fat: 0.9 } },
  batata: { label: "Batata Inglesa / Doce", amount: "120 g", macros: { calories: 104, protein: 2.4, carbs: 24.0, fat: 0.1 } },
};

// OPÇÕES DE PROTEÍNA AJUSTADAS PROTOCOLO TG (Densidade para 140g)
export const PROTEIN_OPTIONS: Record<ProteinKey, { label: string; amount: string; note: string }> = {
  frangoPuro: { label: "Peito de Frango (Alta Densidade)", amount: "150g (Almoço) ou 140g (Jantar)", note: "Filé grelhado ou desfiado. Garante ~45-48g de proteína p/ refeição." },
  carneMagra: { label: "Cortes Bovinos Magros (Patinho/Músculo)", amount: "150g (Almoço) ou 140g (Jantar)", note: "Excelente para saciedade estendida. Evitar cortes gordos." },
  frangoOvo: { label: "Frango + Ovos (Volumoso)", amount: "110g de Frango + 3 Ovos Inteiros", note: "Opção para jantar: alto poder de saciedade por volume." },
  lomboAtum: { label: "Lombo Suíno ou Tilápia", amount: "150g Lombo OU 200g de Tilápia", note: "Opções de digestão leve." },
};

export const WORKOUTS: Record<FocusKey, { id: string; name: string; sets: string; rest: string; substitute: string; biomechanics: string }[]> = {
  treinoA: [
    { id: "supino-inclinado", name: "1. Supino Inclinado com Halteres", sets: "3 × 10", rest: "90 s", substitute: "Supino Inclinado Articulado / Smith", biomechanics: "Banco a 30°; 2s na fase excêntrica." },
    { id: "supino-reto", name: "2. Supino Reto (Barra ou Máquina)", sets: "3 × 10", rest: "90 s", substitute: "Supino Reto com Halteres", biomechanics: "Escápulas retraídas e firmes." },
    { id: "peck-deck", name: "3. Crucifixo Máquina (Peck Deck)", sets: "2 × 12", rest: "60 s", substitute: "Crossover na Polia Alta", biomechanics: "2 séries intensas c/ 1s travado fechado." },
    { id: "desenvolvimento", name: "4. Desenvolvimento com Halteres", sets: "3 × 10", rest: "75 s", substitute: "Desenvolvimento Máquina", biomechanics: "Lombar neutra colada no encosto." },
    { id: "elevacao-lateral", name: "5. Elevação Lateral com Halteres", sets: "3 × 15", rest: "60 s", substitute: "Elevação Lateral na Polia Baixa", biomechanics: "Subir controlado até a linha dos ombros." },
    { id: "triceps-corda-frances", name: "6. Tríceps Corda + 7. Francês", sets: "2×12 + 2×10", rest: "60 s", substitute: "Tríceps Barra Reta + Testa Polia", biomechanics: "4 séries totais de tríceps (alta intensidade)." },
  ],
  treinoB: [
    { id: "puxada-alta", name: "1. Puxada Alta Aberta Pronada", sets: "3 × 10", rest: "75 s", substitute: "Puxada no Triângulo / Graviton", biomechanics: "Iniciar deprimindo as escápulas." },
    { id: "remada-baixa", name: "2. Remada Baixa no Triângulo", sets: "3 × 10", rest: "75 s", substitute: "Remada Máquina Sentado", biomechanics: "Tronco firme; esmagar o meio das costas." },
    { id: "remada-unilateral", name: "3. Remada Unilateral (Serrote)", sets: "3 × 10", rest: "75 s", substitute: "Remada Cavalinho / Articulada", biomechanics: "Puxar o halter em direção ao quadril." },
    { id: "crucifixo-inverso", name: "4. Crucifixo Inverso Máquina", sets: "3 × 12", rest: "60 s", substitute: "Face Pull na Polia Alta c/ Corda", biomechanics: "Estabilização manguito para o futevôlei." },
    { id: "rosca-direta-martelo", name: "5. Rosca Direta W + 6. Rosca Martelo", sets: "2×10 + 2×12", rest: "60 s", substitute: "Rosca Polia Baixa + Martelo Corda", biomechanics: "4 séries totais de bíceps sem roubar." },
  ],
  treinoC: [
    { id: "leg-press", name: "1. Leg Press 45°", sets: "3 × 10", rest: "90 s", substitute: "Agachamento Hack Machine", biomechanics: "Amplitude segura sem tirar o quadril." },
    { id: "cadeira-extensora", name: "2. Cadeira Extensora", sets: "3 × 12", rest: "60 s", substitute: "Afundo Estático c/ Halteres", biomechanics: "Travar 1s no topo (blindagem patelar)." },
    { id: "mesa-flexora", name: "3. Mesa Flexora (Deitado)", sets: "3 × 12", rest: "75 s", substitute: "Flexora Unilateral em Pé", biomechanics: "Segurar a descida (previne estiramento)." },
    { id: "flexora-sentado", name: "4. Cadeira Flexora Sentado (Opcional)", sets: "2 a 3 × 12", rest: "60 s", substitute: "Elevação pélvica ou Pular se jogou futevôlei", biomechanics: "Se jogou futevôlei pesado, pule direto." },
  ],
};

export type PlannedMeal = {
  slot: MealSlot;
  time: string;
  title: string;
  subtitle: string;
  ingredients: string[];
  macros: Macros;
  tag: string;
  clinicalNote: string;
};

export function addMacros(...items: Macros[]): Macros {
  return items.reduce((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: sum.protein + item.protein,
    carbs: sum.carbs + item.carbs,
    fat: sum.fat + item.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function getWaterGoal(mode: TrainingMode): number {
  if (mode === "dobradinha") return 4500; // Hidratação máxima no Protocolo TG Duplo
  if (mode === "futevolei") return 4000;
  return 3500;
}

export function getModeLabel(mode: TrainingMode): string {
  return MODE_OPTIONS.find((item) => item.key === mode)?.label ?? "Musculação";
}

export function getFocusLabel(focus: FocusKey): string {
  return FOCUS_OPTIONS.find((item) => item.key === focus)?.label ?? "Treino A";
}

export function getFocusSubtitle(focus: FocusKey): string {
  return FOCUS_OPTIONS.find((item) => item.key === focus)?.subtitle ?? "";
}

export function getPlannedMeals(settings: DaySettings): PlannedMeal[] {
  const isDouble = settings.trainingMode === "dobradinha";

  // 1. Almoço Estrutural (11h30) - Protocolo TG (Densidade P: ~48g)
  const lunchCarb = CARB_OPTIONS[settings.lunchCarb];
  const lunchIngredients = [
    `${lunchCarb.amount} de ${lunchCarb.label}`,
    settings.lunchProtein === "carneMagra" ? "150g de Patinho ou Músculo magro" : "150g de Peito de Frango (filé ou desfiado)",
    "Salada ou Vinagrete (ácido acético otimiza absorção)",
    "5 ml de Azeite de Oliva Extra Virgem (se frango)",
  ];
  const lunchMacros: Macros = settings.lunchProtein === "carneMagra"
    ? { calories: 328 + lunchCarb.macros.calories, protein: 53.8 + lunchCarb.macros.protein, carbs: lunchCarb.macros.carbs, fat: 10.9 + lunchCarb.macros.fat }
    : { calories: 238 + lunchCarb.macros.calories + 45, protein: 48.0 + lunchCarb.macros.protein, carbs: lunchCarb.macros.carbs, fat: 3.8 + lunchCarb.macros.fat + 5 }; // + azeite

  // 2. Pré-Treino (Lanche - Protocolo TG: ~38g P)
  let snackTitle = "Mingau / Shake Clássico";
  let snackIngredients: string[] = [];
  let snackMacros: Macros = { calories: 390, protein: 32.0, carbs: 46.0, fat: 5.2 };
  if (settings.snackOption === "iogurteWhey") {
    snackTitle = "Iogurte, Whey & Fruta";
    snackIngredients = [
      "170g de Iogurte Natural Desnatado",
      "30g de Whey Protein (1 scoop)",
      "70g de Banana média",
      "20g de Tapioca em pó ou Aveia (para ajuste final de carbo)",
    ];
    snackMacros = { calories: 356, protein: 37.8, carbs: 46.2, fat: 2.1 };
  } else if (settings.snackOption === "romeuJulieta") {
    snackTitle = "Protocolo Romeu & Julieta + Whey";
    snackIngredients = [
      "1 Pão Francês (50g) ou 2 fatias de forma",
      "1 fatia de Queijo Coalho ou Muçarela (30g)",
      "1 fatia fina de Goiabada (25g)",
      "1 scoop de Whey (30g) batido com água gelada",
    ];
    snackMacros = { calories: 412, protein: 34.8, carbs: 52.4, fat: 8.5 };
  } else {
    snackTitle = "Pão com Frango & Fruta";
    snackIngredients = [
      "2 fatias de Pão de Forma (50g)",
      "120g de Peito de Frango desfiado",
      "1 Fruta (Banana ou Maçã)",
    ];
    snackMacros = { calories: 360, protein: 40.1, carbs: 45.0, fat: 4.8 };
  }

  // 3. Gatilho Ergogênico (17h00)
  const triggerMeal: PlannedMeal = {
    slot: "gatilho",
    time: "17:00",
    title: settings.triggerOption === "pacoca" ? "Energia Rápida: 1 Paçoca (20g)" : settings.triggerOption === "banana" ? "Energia Rápida: 1 Banana Média" : "Bomba de Sódio (Pernas): 6-8 Azeitonas",
    subtitle: "Exclusivo para sessão dupla ou treino C",
    tag: "GATILHO ERGOGÊNICO",
    clinicalNote: "15 min antes da areia para evitar hipoglicemia pós-TG.",
    ingredients: settings.triggerOption === "pacoca"
      ? ["1 Paçoca rolha/retangular (20g) 15 min antes da areia", "Absorvida de energia com gordura de amendoim"]
      : settings.triggerOption === "banana"
      ? ["1 Banana média (70g-80g) 15 min antes do treino", "Carboidrato de rápida digestão"]
      : ["6 a 8 Azeitonas em conserva + 350ml de água gelada", "Retém líquido intravascular"],
    macros: settings.triggerOption === "pacoca"
      ? { calories: 92, protein: 2.5, carbs: 11.2, fat: 5.1 }
      : settings.triggerOption === "banana"
      ? { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }
      : { calories: 85, protein: 0.8, carbs: 2.0, fat: 8.2 },
  };

  // 4. Jantar Recuperativo (Até 22h00) - Protocolo TG (Densidade P: ~50g)
  const dinnerCarb = CARB_OPTIONS[settings.dinnerCarb];
  const dinnerIngredients = [
    `${dinnerCarb.amount} de ${dinnerCarb.label}`,
    settings.dinnerProtein === "frangoOvo" ? "110g de Frango Desfiado + 3 Ovos inteiros mexidos" : settings.dinnerProtein === "carneMagra" ? "140g de Patinho/Músculo" : "140g de Peito de Frango (filé/desfiado)",
    "Salada à vontade para saciedade mecânica",
  ];
  const dinnerMacros: Macros = settings.dinnerProtein === "frangoOvo"
    ? { calories: 410 + dinnerCarb.macros.calories, protein: 53.2 + dinnerCarb.macros.protein, carbs: dinnerCarb.macros.carbs + 1.2, fat: 18.0 + dinnerCarb.macros.fat } // Ovos aumentam gordura boa
    : settings.dinnerProtein === "carneMagra"
    ? { calories: 306 + dinnerCarb.macros.calories, protein: 50.2 + dinnerCarb.macros.protein, carbs: dinnerCarb.macros.carbs, fat: 10.1 + dinnerCarb.macros.fat }
    : { calories: 222 + dinnerCarb.macros.calories, protein: 44.8 + dinnerCarb.macros.protein, carbs: dinnerCarb.macros.carbs, fat: 3.5 + dinnerCarb.macros.fat };

  const baseMeals: PlannedMeal[] = [
    {
      slot: "almoco",
      time: "11:30",
      title: `Almoço Estrutural: ${lunchCarb.label}`,
      subtitle: "Base proteica de alta densidade",
      tag: "REFEIÇÃO 01",
      clinicalNote: "Mastigação lenta para sincronizar com a saciedade do TG.",
      ingredients: lunchIngredients,
      macros: lunchMacros,
    },
    {
      slot: "lanche",
      time: "15:00",
      title: `Pré-Treino: ${snackTitle}`,
      subtitle: "Glicogênio de rápida/média absorção",
      tag: "REFEIÇÃO 02",
      clinicalNote: "Garante saciedade até o horário do jantar.",
      ingredients: snackIngredients,
      macros: snackMacros,
    },
  ];

  if (isDouble || settings.workoutFocus === "treinoC") {
    baseMeals.push(triggerMeal);
  }
  
  baseMeals.push({
    slot: "jantar",
    time: "20:30",
    title: `Jantar Recuperativo: ${dinnerCarb.label}`,
    subtitle: "Ressíntese noturna limpa",
    tag: "REFEIÇÃO 03",
    clinicalNote: "Porção adaptada para esvaziamento gástrico lento. Não estenda além das 22h.",
    ingredients: dinnerIngredients,
    macros: dinnerMacros,
  });

  return baseMeals;
}

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftDay(day: string, offset: number): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return localDay(date);
}

export function formatDay(day: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-BR", options ?? { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00`));
}
export function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function clampPercent(value: number, goal: number): number {
  return Math.min(100, Math.max(0, (value / goal) * 100));
}