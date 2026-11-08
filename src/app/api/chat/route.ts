import { db } from "@/db";
import { activityEntries, bodyMeasurements, chatMessages, dailySettings, foodEntries, supplementEntries, waterEntries } from "@/db/schema";
import { DEFAULT_SETTINGS, getPlannedMeals, type DaySettings, type TrainingMode } from "@/lib/fitness";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseWaterMl(text: string): number {
  const lower = text.toLowerCase();

  // "1 litro e 200", "1 litro e 200 de agua", "1 litro e meio"
  const litroE = lower.match(/(\d+)\s*(?:litro|litros|l)\s*e\s*(\d{1,3})/);
  if (litroE) {
    const l = parseInt(litroE[1], 10);
    let ml = parseInt(litroE[2], 10);
    if (ml < 10) ml = ml * 100;
    else if (ml < 100) ml = ml * 10;
    return l * 1000 + ml;
  }

  if (lower.includes("litro e meio") || lower.includes("1,5l") || lower.includes("1.5l")) {
    return 1500;
  }
  if (lower.includes("meio litro") || lower.includes("0,5l") || lower.includes("0.5l")) {
    return 500;
  }

  // "1.2L", "1,2 litros", "2L", "2 litros"
  const decimalLitros = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:litros?|l)\b/);
  if (decimalLitros && !decimalLitros[0].includes("ml")) {
    const val = parseFloat(decimalLitros[1].replace(",", "."));
    if (!Number.isNaN(val) && val > 0 && val <= 6) {
      return Math.round(val * 1000);
    }
  }

  // "1200ml", "1200 ml", "300 ml", "500ml"
  const mlMatch = lower.match(/(\d+)\s*(?:ml|mls)\b/);
  if (mlMatch) {
    const ml = parseInt(mlMatch[1], 10);
    if (!Number.isNaN(ml) && ml > 0 && ml <= 6000) {
      return ml;
    }
  }

  // "2 copos", "1 copo" (250ml)
  const copoMatch = lower.match(/(\d+)\s*copos?\b/);
  if (copoMatch) {
    return parseInt(copoMatch[1], 10) * 250;
  }
  if (lower.includes("um copo") || lower.includes("1 copo")) {
    return 250;
  }

  // "uma garrafa" (500ml)
  if (lower.includes("uma garrafa") || lower.includes("1 garrafa")) {
    return 500;
  }

  return 0;
}

export async function POST(request: Request) {
  let body: { message?: string; date?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const day = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : "";

  if (!message || !day) {
    return Response.json({ error: "Mensagem e data são obrigatórias." }, { status: 400 });
  }

  try {
    // Carregar configurações do dia para saber o plano exato
    const [settingsRow] = await db.select().from(dailySettings).where(eq(dailySettings.day, day)).limit(1);
    const settings: DaySettings = settingsRow ? {
      trainingMode: (settingsRow.trainingMode as DaySettings["trainingMode"]) || DEFAULT_SETTINGS.trainingMode,
      trainingTime: settingsRow.trainingTime || DEFAULT_SETTINGS.trainingTime,
      workoutFocus: (settingsRow.workoutFocus as DaySettings["workoutFocus"]) || DEFAULT_SETTINGS.workoutFocus,
      lunchCarb: (settingsRow.lunchCarb as DaySettings["lunchCarb"]) || DEFAULT_SETTINGS.lunchCarb,
      lunchProtein: (settingsRow.lunchProtein as DaySettings["lunchProtein"]) || DEFAULT_SETTINGS.lunchProtein,
      snackOption: (settingsRow.snackOption as DaySettings["snackOption"]) || DEFAULT_SETTINGS.snackOption,
      triggerOption: (settingsRow.triggerOption as DaySettings["triggerOption"]) || DEFAULT_SETTINGS.triggerOption,
      dinnerCarb: (settingsRow.dinnerCarb as DaySettings["dinnerCarb"]) || DEFAULT_SETTINGS.dinnerCarb,
      dinnerProtein: (settingsRow.dinnerProtein as DaySettings["dinnerProtein"]) || DEFAULT_SETTINGS.dinnerProtein,
      weighInDay: settingsRow.weighInDay || DEFAULT_SETTINGS.weighInDay,
    } : { ...DEFAULT_SETTINGS };

    const plannedMeals = getPlannedMeals(settings);
    const actionsTaken: string[] = [];
    const lower = message.toLowerCase();

    // 1. ÁGUA
    const waterMl = parseWaterMl(message);
    if (waterMl > 0) {
      await db.insert(waterEntries).values({ day, amount: waterMl });
      actionsTaken.push(`+${waterMl >= 1000 ? `${(waterMl / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} L` : `${waterMl} ml`} de água`);
    }

    // 2. CREATINA
    if (lower.includes("creatina")) {
      if (lower.includes("não tomei") || lower.includes("desmarque") || lower.includes("esqueci")) {
        await db.delete(supplementEntries).where(and(eq(supplementEntries.day, day), eq(supplementEntries.name, "Creatina")));
        actionsTaken.push("Creatina desmarcada");
      } else {
        await db.insert(supplementEntries).values({ day, name: "Creatina", amount: "5 g", taken: true }).onConflictDoUpdate({
          target: [supplementEntries.day, supplementEntries.name],
          set: { taken: true, amount: "5 g", createdAt: new Date() },
        });
        actionsTaken.push("Creatina (5g) marcada");
      }
    }

    // 3. ALMOÇO
    if (lower.includes("almocei") || lower.includes("almoço") || lower.includes("almoco") || lower.includes("refeição 1") || lower.includes("refeicao 1")) {
      const lunchPlan = plannedMeals.find((m) => m.slot === "almoco");
      if (lunchPlan) {
        const existing = await db.select({ id: foodEntries.id }).from(foodEntries).where(and(eq(foodEntries.day, day), eq(foodEntries.mealSlot, "almoco"), eq(foodEntries.source, "plan"))).limit(1);
        if (!existing.length) {
          await db.insert(foodEntries).values({
            day,
            mealSlot: "almoco",
            title: lunchPlan.title,
            details: lunchPlan.ingredients.join(" · "),
            calories: lunchPlan.macros.calories,
            protein: lunchPlan.macros.protein,
            carbs: lunchPlan.macros.carbs,
            fat: lunchPlan.macros.fat,
            source: "plan",
          });
          actionsTaken.push("Almoço Estrutural contabilizado (~640 kcal • 48g prot)");
        } else {
          actionsTaken.push("Almoço já estava registrado no seu dia");
        }
      }
    }

    // 4. PRÉ-TREINO / LANCHE
    if (lower.includes("pré-treino") || lower.includes("pre treino") || lower.includes("lanche") || lower.includes("whey") || lower.includes("aveia") || lower.includes("mingau") || lower.includes("romeu e julieta") || lower.includes("shake")) {
      const snackPlan = plannedMeals.find((m) => m.slot === "lanche");
      if (snackPlan) {
        const existing = await db.select({ id: foodEntries.id }).from(foodEntries).where(and(eq(foodEntries.day, day), eq(foodEntries.mealSlot, "lanche"), eq(foodEntries.source, "plan"))).limit(1);
        if (!existing.length) {
          await db.insert(foodEntries).values({
            day,
            mealSlot: "lanche",
            title: snackPlan.title,
            details: snackPlan.ingredients.join(" · "),
            calories: snackPlan.macros.calories,
            protein: snackPlan.macros.protein,
            carbs: snackPlan.macros.carbs,
            fat: snackPlan.macros.fat,
            source: "plan",
          });
          actionsTaken.push("Pré-Treino contabilizado (~390 kcal • 32g prot)");
        } else {
          actionsTaken.push("Pré-Treino já estava registrado");
        }
      }
    }

    // 5. GATILHO ERGOGÊNICO / PAÇOCA EXTRA
    if (lower.includes("paçoca") || lower.includes("pacoca") || lower.includes("gatilho") || lower.includes("azeitona") || lower.includes("banana extra")) {
      const triggerPlan = plannedMeals.find((m) => m.slot === "gatilho") || {
        title: "Energia Rápida: 1 Paçoca (20g)",
        ingredients: ["1 Paçoca (20g) antes da areia"],
        macros: { calories: 92, protein: 2.5, carbs: 11.2, fat: 5.1 },
      };
      const existing = await db.select({ id: foodEntries.id }).from(foodEntries).where(and(eq(foodEntries.day, day), eq(foodEntries.mealSlot, "gatilho"))).limit(1);
      if (!existing.length) {
        await db.insert(foodEntries).values({
          day,
          mealSlot: "gatilho",
          title: triggerPlan.title,
          details: triggerPlan.ingredients.join(" · "),
          calories: triggerPlan.macros.calories,
          protein: triggerPlan.macros.protein,
          carbs: triggerPlan.macros.carbs,
          fat: triggerPlan.macros.fat,
          source: "plan",
        });
        actionsTaken.push("Gatilho Ergogênico (Paçoca ~90 kcal) contabilizado");
      } else {
        actionsTaken.push("Gatilho Ergogênico já havia sido registrado");
      }
    }

    // 6. JANTAR RECUPERATIVO
    if (lower.includes("jantei") || lower.includes("jantar") || lower.includes("refeição 3") || lower.includes("refeicao 3")) {
      const dinnerPlan = plannedMeals.find((m) => m.slot === "jantar");
      if (dinnerPlan) {
        const existing = await db.select({ id: foodEntries.id }).from(foodEntries).where(and(eq(foodEntries.day, day), eq(foodEntries.mealSlot, "jantar"), eq(foodEntries.source, "plan"))).limit(1);
        if (!existing.length) {
          await db.insert(foodEntries).values({
            day,
            mealSlot: "jantar",
            title: dinnerPlan.title,
            details: dinnerPlan.ingredients.join(" · "),
            calories: dinnerPlan.macros.calories,
            protein: dinnerPlan.macros.protein,
            carbs: dinnerPlan.macros.carbs,
            fat: dinnerPlan.macros.fat,
            source: "plan",
          });
          actionsTaken.push("Jantar Recuperativo contabilizado (~830 kcal • 58g prot)");
        } else {
          actionsTaken.push("Jantar já estava registrado");
        }
      }
    }

    // 7. ATIVIDADE / TREINO
    if (lower.includes("futevôlei") || lower.includes("futevolei") || lower.includes("areia") || lower.includes("joguei")) {
      let duration = 60;
      const minMatch = lower.match(/(\d+)\s*(?:min|minutos)/);
      const hMatch = lower.match(/(\d+)\s*h(?:oras?)?/);
      if (minMatch) duration = parseInt(minMatch[1], 10);
      else if (hMatch) duration = parseInt(hMatch[1], 10) * 60;
      await db.insert(activityEntries).values({ day, type: "futevolei", label: "Futevôlei (Areia)", duration });
      actionsTaken.push(`Treino de Futevôlei registrado (${duration} min)`);
    } else if (lower.includes("treinei") || lower.includes("musculação") || lower.includes("musculacao") || lower.includes("academia") || lower.includes("treino a") || lower.includes("treino b") || lower.includes("treino c")) {
      let duration = 40;
      const minMatch = lower.match(/(\d+)\s*(?:min|minutos)/);
      if (minMatch) duration = parseInt(minMatch[1], 10);
      const label = lower.includes("treino b") ? "Musculação (Treino B - Dorsal)" : lower.includes("treino c") ? "Musculação (Treino C - Pernas)" : "Musculação (Treino A - Peito & Ombro)";
      await db.insert(activityEntries).values({ day, type: "musculacao", label, duration });
      actionsTaken.push(`${label} registrado (${duration} min)`);
    }

    // 8. PESO
    const pesoMatch = lower.match(/(?:peso|pesei|pesando)\s*(?:de|com|em)?\s*(\d+(?:[.,]\d+)?)\s*(?:kg|quilos)?/);
    if (pesoMatch) {
      const val = parseFloat(pesoMatch[1].replace(",", "."));
      if (!Number.isNaN(val) && val >= 30 && val <= 300) {
        await db.insert(bodyMeasurements).values({ day, weight: val }).onConflictDoUpdate({
          target: bodyMeasurements.day,
          set: { weight: val, createdAt: new Date() },
        });
        actionsTaken.push(`Peso atualizado: ${val.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} kg`);
      }
    }

    // Resposta amigável do assistente
    let assistantReply = "";
    if (actionsTaken.length > 0) {
      assistantReply = `Feito! Anotei para você: ${actionsTaken.join("; ")}. Seu dia foi atualizado com sucesso!`;
    } else {
      assistantReply = `Entendi o que você disse! Posso registrar quando você almoçar, fizer o pré-treino ou jantar, beber água (ex: "bebi 1L e 200 de água"), comer paçoca, tomar creatina, treinar ou se pesar. Pode falar por voz ou digitar que eu contabilizo na hora!`;
    }

    // Gravar no histórico de chat
    await db.insert(chatMessages).values({
      day,
      role: "user",
      text: message,
    });

    const [savedAssistant] = await db.insert(chatMessages).values({
      day,
      role: "assistant",
      text: assistantReply,
      actionsSummary: actionsTaken.length > 0 ? actionsTaken.join(" | ") : null,
    }).returning();

    return Response.json({
      ok: true,
      reply: assistantReply,
      actionsTaken,
      savedMessage: {
        id: savedAssistant.id,
        role: "assistant",
        text: assistantReply,
        actionsSummary: savedAssistant.actionsSummary,
        createdAt: savedAssistant.createdAt.toISOString(),
      },
    });
  } catch (cause) {
    console.error("Chat processor error", cause);
    return Response.json({ error: "Não foi possível processar sua mensagem agora." }, { status: 500 });
  }
}
