import { db } from "@/db";
import { activityEntries, bodyMeasurements, chatMessages, dailySettings, exerciseEntries, foodEntries, supplementEntries, waterEntries } from "@/db/schema";
import { CARB_OPTIONS, DEFAULT_SETTINGS, FOCUS_OPTIONS, MODE_OPTIONS, PROTEIN_OPTIONS, SNACK_OPTIONS, TRIGGER_OPTIONS, WEIGH_DAYS, WORKOUTS, shiftDay, type DaySettings, type FocusKey, type HistoryPoint, type MealSlot, type TrainingMode } from "@/lib/fitness";
import { and, eq, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CARBS = Object.keys(CARB_OPTIONS);
const PROTEINS = Object.keys(PROTEIN_OPTIONS);
const SNACKS = Object.keys(SNACK_OPTIONS);
const TRIGGERS = Object.keys(TRIGGER_OPTIONS);
const SLOTS: MealSlot[] = ["almoco", "lanche", "gatilho", "jantar", "extra"];
const MODES = MODE_OPTIONS.map((item) => item.key);
const FOCUSES = FOCUS_OPTIONS.map((item) => item.key);
const WEIGH_DAY_KEYS = WEIGH_DAYS.map((item) => item.key);

function validDay(day: unknown): day is string {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}

function validNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function getSettings(row: typeof dailySettings.$inferSelect | undefined): DaySettings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    trainingMode: (row.trainingMode as DaySettings["trainingMode"]) || DEFAULT_SETTINGS.trainingMode,
    trainingTime: row.trainingTime || DEFAULT_SETTINGS.trainingTime,
    workoutFocus: (row.workoutFocus as DaySettings["workoutFocus"]) || DEFAULT_SETTINGS.workoutFocus,
    lunchCarb: (row.lunchCarb as DaySettings["lunchCarb"]) || DEFAULT_SETTINGS.lunchCarb,
    lunchProtein: (row.lunchProtein as DaySettings["lunchProtein"]) || DEFAULT_SETTINGS.lunchProtein,
    snackOption: (row.snackOption as DaySettings["snackOption"]) || DEFAULT_SETTINGS.snackOption,
    triggerOption: (row.triggerOption as DaySettings["triggerOption"]) || DEFAULT_SETTINGS.triggerOption,
    dinnerCarb: (row.dinnerCarb as DaySettings["dinnerCarb"]) || DEFAULT_SETTINGS.dinnerCarb,
    dinnerProtein: (row.dinnerProtein as DaySettings["dinnerProtein"]) || DEFAULT_SETTINGS.dinnerProtein,
    weighInDay: row.weighInDay || DEFAULT_SETTINGS.weighInDay,
  };
}

export async function GET(request: Request) {
  const day = new URL(request.url).searchParams.get("date");
  if (!validDay(day)) return error("Data inválida.");

  try {
    const start = shiftDay(day, -6);
    const measurementsStart = shiftDay(day, -30);
    const [settingsRows, foods, waters, activities, exercises, measurements, supplements, chats, pastFoods, pastWaters, pastActivities] = await Promise.all([
      db.select().from(dailySettings).where(eq(dailySettings.day, day)).limit(1),
      db.select().from(foodEntries).where(eq(foodEntries.day, day)).orderBy(foodEntries.createdAt),
      db.select().from(waterEntries).where(eq(waterEntries.day, day)).orderBy(waterEntries.createdAt),
      db.select().from(activityEntries).where(eq(activityEntries.day, day)).orderBy(activityEntries.createdAt),
      db.select().from(exerciseEntries).where(eq(exerciseEntries.day, day)),
      db.select().from(bodyMeasurements).where(and(gte(bodyMeasurements.day, measurementsStart), lte(bodyMeasurements.day, day))).orderBy(bodyMeasurements.day),
      db.select().from(supplementEntries).where(eq(supplementEntries.day, day)).orderBy(supplementEntries.createdAt),
      db.select().from(chatMessages).where(eq(chatMessages.day, day)).orderBy(chatMessages.createdAt),
      db.select().from(foodEntries).where(and(gte(foodEntries.day, start), lte(foodEntries.day, day))),
      db.select().from(waterEntries).where(and(gte(waterEntries.day, start), lte(waterEntries.day, day))),
      db.select().from(activityEntries).where(and(gte(activityEntries.day, start), lte(activityEntries.day, day))),
    ]);

    const history: HistoryPoint[] = Array.from({ length: 7 }, (_, index) => {
      const historyDay = shiftDay(start, index);
      const dayFoods = pastFoods.filter((item) => item.day === historyDay);
      return {
        day: historyDay,
        calories: dayFoods.reduce((sum, item) => sum + item.calories, 0),
        protein: dayFoods.reduce((sum, item) => sum + item.protein, 0),
        carbs: dayFoods.reduce((sum, item) => sum + item.carbs, 0),
        fat: dayFoods.reduce((sum, item) => sum + item.fat, 0),
        water: pastWaters.filter((item) => item.day === historyDay).reduce((sum, item) => sum + item.amount, 0),
        workouts: pastActivities.filter((item) => item.day === historyDay).length,
        weight: measurements.find((item) => item.day === historyDay)?.weight ?? null,
      };
    });

    return Response.json({
      settings: getSettings(settingsRows[0]),
      foods,
      waters,
      activities,
      exercises,
      supplements,
      measurement: measurements.find((item) => item.day === day) ?? null,
      measurementHistory: measurements,
      chatHistory: chats.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      history,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Failed to load day", cause);
    return error("Não foi possível carregar seus dados agora.", 500);
  }
}

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return error("Dados inválidos.");
  }
  if (!input || !validDay(input.date)) return error("Data inválida.");
  const day = input.date;

  try {
    if (input.action === "settings") {
      const value = input.updates;
      if (!value || typeof value !== "object" || Array.isArray(value)) return error("Preferências inválidas.");
      const updatesInput = value as Record<string, unknown>;
      const updates: Partial<DaySettings> = {};
      if (MODES.includes(updatesInput.trainingMode as TrainingMode)) updates.trainingMode = updatesInput.trainingMode as TrainingMode;
      if (["17:00", "19:00", "20:30", "21:00"].includes(updatesInput.trainingTime as string)) updates.trainingTime = updatesInput.trainingTime as string;
      if (FOCUSES.includes(updatesInput.workoutFocus as FocusKey)) updates.workoutFocus = updatesInput.workoutFocus as FocusKey;
      if (CARBS.includes(updatesInput.lunchCarb as string)) updates.lunchCarb = updatesInput.lunchCarb as DaySettings["lunchCarb"];
      if (PROTEINS.includes(updatesInput.lunchProtein as string)) updates.lunchProtein = updatesInput.lunchProtein as DaySettings["lunchProtein"];
      if (SNACKS.includes(updatesInput.snackOption as string)) updates.snackOption = updatesInput.snackOption as DaySettings["snackOption"];
      if (TRIGGERS.includes(updatesInput.triggerOption as string)) updates.triggerOption = updatesInput.triggerOption as DaySettings["triggerOption"];
      if (CARBS.includes(updatesInput.dinnerCarb as string)) updates.dinnerCarb = updatesInput.dinnerCarb as DaySettings["dinnerCarb"];
      if (PROTEINS.includes(updatesInput.dinnerProtein as string)) updates.dinnerProtein = updatesInput.dinnerProtein as DaySettings["dinnerProtein"];
      if (WEIGH_DAY_KEYS.includes(updatesInput.weighInDay as string)) updates.weighInDay = updatesInput.weighInDay as string;
      if (Object.keys(updates).length === 0) return error("Nenhuma preferência válida foi enviada.");
      await db.insert(dailySettings).values({ day, ...updates }).onConflictDoUpdate({
        target: dailySettings.day,
        set: { ...updates, updatedAt: new Date() },
      });
      return Response.json({ ok: true });
    }

    if (input.action === "food") {
      const title = typeof input.title === "string" ? input.title.trim().slice(0, 160) : "";
      const slot = input.mealSlot as MealSlot;
      if (!title || !SLOTS.includes(slot) || !validNumber(input.calories, 0, 4000) || !validNumber(input.protein, 0, 500) || !validNumber(input.carbs, 0, 600) || !validNumber(input.fat, 0, 300)) return error("Confira os dados da refeição.");
      const source = input.source === "plan" ? "plan" : "custom";
      if (source === "plan") {
        const existing = await db.select({ id: foodEntries.id }).from(foodEntries).where(and(eq(foodEntries.day, day), eq(foodEntries.mealSlot, slot), eq(foodEntries.source, "plan"))).limit(1);
        if (existing.length) return error("Esta refeição do plano já foi registrada.", 409);
      }
      await db.insert(foodEntries).values({
        day, mealSlot: slot, title, details: typeof input.details === "string" ? input.details.trim().slice(0, 500) : null,
        calories: Math.round(input.calories), protein: input.protein, carbs: input.carbs, fat: input.fat, source,
      });
      return Response.json({ ok: true });
    }

    if (input.action === "supplement") {
      const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "Creatina";
      if (name !== "Creatina") return error("Suplemento inválido.");
      const amount = typeof input.amount === "string" ? input.amount.trim().slice(0, 40) : "5 g";
      if (typeof input.taken !== "boolean") return error("Informe o estado da creatina.");
      if (input.taken) {
        await db.insert(supplementEntries).values({ day, name, amount, taken: true }).onConflictDoUpdate({
          target: [supplementEntries.day, supplementEntries.name],
          set: { taken: true, amount, createdAt: new Date() },
        });
      } else {
        await db.delete(supplementEntries).where(and(eq(supplementEntries.day, day), eq(supplementEntries.name, name)));
      }
      return Response.json({ ok: true });
    }

    if (input.action === "water") {
      if (!validNumber(input.amount, 50, 4000)) return error("Informe entre 50 e 4.000 ml de água.");
      await db.insert(waterEntries).values({ day, amount: Math.round(input.amount) });
      return Response.json({ ok: true });
    }

    if (input.action === "activity") {
      const type = input.type as TrainingMode;
      const label = typeof input.label === "string" ? input.label.trim().slice(0, 100) : "";
      if (!MODES.includes(type) || type === "descanso" || !label || !validNumber(input.duration, 1, 600)) return error("Confira os dados da atividade.");
      await db.insert(activityEntries).values({ day, type, label, duration: Math.round(input.duration) });
      return Response.json({ ok: true });
    }

    if (input.action === "exercise") {
      const focus = input.focus as FocusKey;
      const exerciseId = input.exerciseId as string;
      if (!FOCUSES.includes(focus) || !WORKOUTS[focus].some((item) => item.id === exerciseId) || typeof input.completed !== "boolean") return error("Exercício inválido.");
      if (input.completed) {
        await db.insert(exerciseEntries).values({ day, focus, exerciseId, completed: true }).onConflictDoNothing();
      } else {
        await db.delete(exerciseEntries).where(and(eq(exerciseEntries.day, day), eq(exerciseEntries.focus, focus), eq(exerciseEntries.exerciseId, exerciseId)));
      }
      return Response.json({ ok: true });
    }

    if (input.action === "weight") {
      if (!validNumber(input.weight, 30, 300)) return error("Confira o peso informado.");
      const waist = typeof input.waist === "number" && validNumber(input.waist, 30, 200) ? input.waist : null;
      const chest = typeof input.chest === "number" && validNumber(input.chest, 30, 200) ? input.chest : null;
      const arms = typeof input.arms === "number" && validNumber(input.arms, 15, 100) ? input.arms : null;
      const thighs = typeof input.thighs === "number" && validNumber(input.thighs, 20, 150) ? input.thighs : null;
      const hips = typeof input.hips === "number" && validNumber(input.hips, 30, 200) ? input.hips : null;
      await db.insert(bodyMeasurements).values({
        day, weight: input.weight, waist, chest, arms, thighs, hips,
      }).onConflictDoUpdate({
        target: bodyMeasurements.day,
        set: { weight: input.weight, waist, chest, arms, thighs, hips, createdAt: new Date() },
      });
      return Response.json({ ok: true });
    }

    return error("Ação não reconhecida.");
  } catch (cause) {
    console.error("Failed to update day", cause);
    return error("Não foi possível salvar. Tente novamente.", 500);
  }
}

export async function DELETE(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return error("Dados inválidos.");
  }
  if (!input || !validDay(input.date)) return error("Data inválida.");
  const day = input.date;
  try {
    if (input.action === "food" && validNumber(input.id, 1, 1_000_000_000)) {
      await db.delete(foodEntries).where(and(eq(foodEntries.id, input.id), eq(foodEntries.day, day)));
    } else if (input.action === "water" && validNumber(input.id, 1, 1_000_000_000)) {
      await db.delete(waterEntries).where(and(eq(waterEntries.id, input.id), eq(waterEntries.day, day)));
    } else if (input.action === "activity" && validNumber(input.id, 1, 1_000_000_000)) {
      await db.delete(activityEntries).where(and(eq(activityEntries.id, input.id), eq(activityEntries.day, day)));
    } else if (input.action === "weight") {
      await db.delete(bodyMeasurements).where(eq(bodyMeasurements.day, day));
    } else if (input.action === "reset") {
      await Promise.all([
        db.delete(foodEntries).where(eq(foodEntries.day, day)),
        db.delete(waterEntries).where(eq(waterEntries.day, day)),
        db.delete(activityEntries).where(eq(activityEntries.day, day)),
        db.delete(exerciseEntries).where(eq(exerciseEntries.day, day)),
        db.delete(bodyMeasurements).where(eq(bodyMeasurements.day, day)),
        db.delete(supplementEntries).where(eq(supplementEntries.day, day)),
      ]);
    } else {
      return error("Ação não reconhecida.");
    }
    return Response.json({ ok: true });
  } catch (cause) {
    console.error("Failed to delete entry", cause);
    return error("Não foi possível remover o registro.", 500);
  }
}
