export const GOALS = { calories: 1950, protein: 140, carbs: 228, fat: 54 } as const;
export type TrainingMode = "musculacao" | "futevolei" | "dobradinha" | "descanso";
export type FocusKey = "treinoA" | "treinoB" | "treinoC";
export type CarbKey = "arroz" | "macarrao" | "macaxeira" | "cuscuz" | "tapioca" | "pao" | "batata";
export type ProteinKey = "frangoOvo" | "frangoPuro" | "carneMagra" | "lomboAtum";
export type SnackKey = "aveiaWhey" | "romeuJulieta" | "paoFrango";
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
  lunchProtein: "frangoOvo",
  snackOption: "aveiaWhey",
  triggerOption: "pacoca",
  dinnerCarb: "macaxeira",
  dinnerProtein: "frangoOvo",
  weighInDay: "domingo",
};

// Metas operacionais conforme Ficha Técnica RAG (Luciano)
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

export const CARB_OPTIONS: Record<CarbKey, { label: string; amount: string; macros: Macros }> = {
  arroz: { label: "Arroz Branco / Parboilizado", amount: "160 g", macros: { calories: 208, protein: 4.3, carbs: 45, fat: 0.5 } },
  macarrao: { label: "Macarrão Cozido", amount: "180 g", macros: { calories: 280, protein: 10.2, carbs: 55.4, fat: 1.6 } },
  macaxeira: { label: "Macaxeira Cozida (Aipim)", amount: "180 g", macros: { calories: 225, protein: 1.1, carbs: 54.2, fat: 0.5 } },
  cuscuz: { label: "Cuscuz Simples (Flocão)", amount: "150 g", macros: { calories: 168, protein: 3.3, carbs: 38.0, fat: 1.1 } },
  tapioca: { label: "Goma de Tapioca", amount: "85 g", macros: { calories: 204, protein: 0.2, carbs: 50.1, fat: 0.1 } },
  pao: { label: "Pão Francês (2 un)", amount: "100 g", macros: { calories: 270, protein: 8.8, carbs: 54.0, fat: 1.8 } },
  batata: { label: "Batata Inglesa / Doce", amount: "240 g", macros: { calories: 208, protein: 4.8, carbs: 48.0, fat: 0.3 } },
};

export const PROTEIN_OPTIONS: Record<ProteinKey, { label: string; amount: string; note: string }> = {
  frangoOvo: { label: "Frango + 1 Ovo Cozido", amount: "100g a 110g de Frango + 1 Ovo inteiro", note: "Padrão mais econômico, garante micronutrientes da gema." },
  frangoPuro: { label: "Peito de Frango Puro", amount: "150g (Almoço) ou 130g (Jantar s/ ovo)", note: "Filé grelhado/assado ou desfiado na pressão c/ tomate/cenoura." },
  carneMagra: { label: "Cortes Bovinos Magros", amount: "130g a 140g (Patinho, Músculo ou Acém)", note: "Músculo cozido na pressão: baixo custo e colágeno articular." },
  lomboAtum: { label: "Lombo Suíno ou Atum + Ovos", amount: "140g Lombo OU 1 lata Atum + 2 Ovos", note: "Se usar 2 ou 3 ovos inteiros, não adicione azeite na salada." },
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
  if (mode === "dobradinha") return 4000;
  if (mode === "futevolei") return 3750;
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
  const hasCheeseSnack = settings.snackOption === "romeuJulieta";

  // 1. Almoço Estrutural (11h30)
  const lunchCarb = CARB_OPTIONS[settings.lunchCarb];
  const lunchIngredients = [
    `${lunchCarb.amount} de ${lunchCarb.label}`,
    settings.lunchProtein === "frangoOvo" ? "100g a 110g de Peito de Frango + 1 Ovo Cozido inteiro" : "150g de Peito de Frango (filé ou desfiado)",
    "Vinagrete à vontade (ácido acético reduz pico glicêmico)",
    settings.lunchProtein === "frangoOvo" ? "Sem azeite extra (gordura balanceada pela gema)" : "5 ml de Azeite de Oliva Extra Virgem",
  ];
  const lunchMacros: Macros = settings.lunchProtein === "frangoOvo"
    ? { calories: 638, protein: 48.2, carbs: lunchCarb.macros.carbs, fat: 12.8 }
    : { calories: 642, protein: 49.5, carbs: lunchCarb.macros.carbs, fat: 12.1 };

  // 2. Pré-Treino (14h45)
  let snackTitle = "Mingau / Shake Clássico";
  let snackIngredients: string[] = [];
  let snackMacros: Macros = { calories: 390, protein: 32.0, carbs: 46.0, fat: 5.2 };
  if (settings.snackOption === "aveiaWhey") {
    snackTitle = "Aveia, Whey & Fruta";
    snackIngredients = [
      "40g de Aveia em Flocos (3 col. sopa cheias)",
      "30g de Whey Protein (1 scoop)",
      "1 Banana média (70g) ou 6-8 Morangos frescos",
      "Pode ser feito como shake com água gelada ou mingau (1 min no micro-ondas)",
    ];
    snackMacros = { calories: 388, protein: 32.2, carbs: 46.5, fat: 5.1 };
  } else if (settings.snackOption === "romeuJulieta") {
    snackTitle = "Protocolo Romeu & Julieta + Whey";
    snackIngredients = [
      "1 Pão Francês (50g)",
      "1 fatia de Queijo Coalho ou Muçarela (30g)",
      "1 fatia de Goiabada (25g)",
      "1 scoop de Whey (30g) batido com água gelada e 5 morangos",
    ];
    snackMacros = { calories: 412, protein: 32.8, carbs: 52.4, fat: 8.5 };
  } else {
    snackTitle = "Pão com Frango & Fruta (Sem Whey)";
    snackIngredients = [
      "2 fatias de Pão de Forma (ou 1 Pão Francês)",
      "90g de Peito de Frango desfiado",
      "1 Fruta (Banana ou Maçã)",
      "Econômico e prático para dias sem shake",
    ];
    snackMacros = { calories: 382, protein: 32.1, carbs: 45.0, fat: 4.8 };
  }

  // 3. Gatilho Ergogênico (17h00)
  const triggerMeal: PlannedMeal = {
    slot: "gatilho",
    time: "17:00",
    title: settings.triggerOption === "pacoca" ? "Energia Rápida: 1 Paçoca (20g)" : settings.triggerOption === "banana" ? "Energia Rápida: 1 Banana Média" : "Bomba de Sódio (Pernas): 6-8 Azeitonas",
    subtitle: "Exclusivo para sessão dupla (Musculação + Futevôlei) ou treino C",
    tag: "GATILHO ERGOGÊNICO",
    clinicalNote: "15 min antes da areia para estabilizar a glicemia e prevenir fadiga.",
    ingredients: settings.triggerOption === "pacoca"
      ? ["1 Paçoca rolha/retangular (20g) 15 min antes da areia", "Absorvida de energia com gordura de amendoim"]
      : settings.triggerOption === "banana"
      ? ["1 Banana média (70g-80g) 15 min antes do treino", "Carboidrato de rápida digestão"]
      : ["6 a 8 Azeitonas em conserva + 350ml de água gelada", "Retíquido intravascular para evitar queda de pressão no Leg Press"],
    macros: settings.triggerOption === "pacoca"
      ? { calories: 92, protein: 2.5, carbs: 11.2, fat: 5.1 }
      : settings.triggerOption === "banana"
      ? { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }
      : { calories: 85, protein: 0.8, carbs: 2.0, fat: 8.2 },
  };

  // 4. Jantar Recuperativo (20h30)
  const dinnerCarb = CARB_OPTIONS[settings.dinnerCarb];
  const dinnerProteinKey: ProteinKey = hasCheeseSnack ? "frangoPuro" : settings.dinnerProtein;
  const dinnerIngredients = [
    `${dinnerCarb.amount} de ${dinnerCarb.label}`,
    hasCheeseSnack
      ? "130g de Peito de Frango grelhado/desfiado (sem ovo, compensado pelo queijo do lanche)"
      : dinnerProteinKey === "frangoOvo"
      ? "100g a 110g de Peito de Frango + 1 Ovo Cozido inteiro"
      : "140g de Peito de Frango puro ou Patinho moído",
    "Salada ou vinagrete à vontade",
    hasCheeseSnack ? "Sem azeite extra (lípidios compensados no lanche)" : "5 ml de azeite de oliva se não houver ovo",
  ];
  const dinnerMacros: Macros = hasCheeseSnack
    ? { calories: 818, protein: 57.5, carbs: dinnerCarb.macros.carbs + 42, fat: 12.0 }
    : dinnerProteinKey === "frangoOvo"
    ? { calories: 830, protein: 58.2, carbs: dinnerCarb.macros.carbs + 44, fat: 14.5 }
    : { calories: 825, protein: 58.8, carbs: dinnerCarb.macros.carbs + 44, fat: 11.2 };

  const baseMeals: PlannedMeal[] = [
    {
      slot: "almoco",
      time: "11:30",
      title: `Almoço Estrutural: ${lunchCarb.label}`,
      subtitle: "Base de glicogênio e aminoácidos para o dia",
      tag: "REFEIÇÃO 01",
      clinicalNote: "Beba 1,5L a 2,0L de água antes das 11h30. O vinagrete reduz o pico glicêmico.",
      ingredients: lunchIngredients,
      macros: lunchMacros,
    },
    {
      slot: "lanche",
      time: "14h45",
      title: `Pré-Treino: ${snackTitle}`,
      subtitle: "Combustível de alta absorção para o rendimento",
      tag: "REFEIÇÃO 02",
      clinicalNote: "Tome seus 5g de Creatina todos os dias. Se usar a Opção Romeu & Julieta, retire o ovo do jantar.",
      ingredients: snackIngredients,
      macros: snackMacros,
    },
  ];

  if (isDouble || settings.workoutFocus === "treinoC") {
    baseMeals.push(triggerMeal);
  }
  
  baseMeals.push({
    slot: "jantar",
    time: "20h30",
    title: `Jantar Recuperativo: ${dinnerCarb.label}`,
    subtitle: "Ressíntese de glicogênio muscular noturna",
    tag: "REFEIÇÃO 03",
    clinicalNote: "Beba 400ml de água junto à refeição para saciedade. Janela alimentar fecha às 22h00.",
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