import { boolean, index, integer, pgTable, real, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const dailySettings = pgTable("daily_settings", {
  day: varchar("day", { length: 10 }).primaryKey(),
  trainingMode: varchar("training_mode", { length: 24 }).notNull().default("musculacao"),
  trainingTime: varchar("training_time", { length: 5 }).notNull().default("17:00"),
  workoutFocus: varchar("workout_focus", { length: 24 }).notNull().default("treinoA"),
  lunchCarb: varchar("lunch_carb", { length: 24 }).notNull().default("arroz"),
  lunchProtein: varchar("lunch_protein", { length: 24 }).notNull().default("frangoOvo"),
  snackOption: varchar("snack_option", { length: 24 }).notNull().default("aveiaWhey"),
  triggerOption: varchar("trigger_option", { length: 24 }).notNull().default("pacoca"),
  dinnerCarb: varchar("dinner_carb", { length: 24 }).notNull().default("macaxeira"),
  dinnerProtein: varchar("dinner_protein", { length: 24 }).notNull().default("frangoOvo"),
  weighInDay: varchar("weigh_in_day", { length: 16 }).notNull().default("domingo"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const foodEntries = pgTable("food_entries", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  mealSlot: varchar("meal_slot", { length: 24 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  details: text("details"),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fat: real("fat").notNull().default(0),
  source: varchar("source", { length: 16 }).notNull().default("custom"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("food_entries_day_idx").on(table.day)]);

export const supplementEntries = pgTable("supplement_entries", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  name: varchar("name", { length: 80 }).notNull().default("Creatina"),
  amount: varchar("amount", { length: 40 }).notNull().default("5 g"),
  taken: boolean("taken").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("supplement_day_name_key").on(table.day, table.name)]);

export const waterEntries = pgTable("water_entries", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("water_entries_day_idx").on(table.day)]);

export const activityEntries = pgTable("activity_entries", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  type: varchar("type", { length: 24 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("activity_entries_day_idx").on(table.day)]);

export const exerciseEntries = pgTable("exercise_entries", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  focus: varchar("focus", { length: 24 }).notNull(),
  exerciseId: varchar("exercise_id", { length: 48 }).notNull(),
  completed: boolean("completed").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("exercise_day_focus_key").on(table.day, table.focus, table.exerciseId)]);

export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  weight: real("weight").notNull(),
  waist: real("waist"),
  chest: real("chest"),
  arms: real("arms"),
  thighs: real("thighs"),
  hips: real("hips"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("body_measurements_day_key").on(table.day)]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  day: varchar("day", { length: 10 }).notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  text: text("text").notNull(),
  actionsSummary: text("actions_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("chat_messages_day_idx").on(table.day)]);
