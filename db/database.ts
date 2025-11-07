// db/database.ts - reescrito usando API assíncrona moderna do expo-sqlite
// Evita erros de runtime com openDatabase() em SDKs recentes.

import * as SQLite from "expo-sqlite";

// Tipos de domínio
export type ReportResult = {
  id: string;
  templateId: string;
  studentName: string;
  studentMatricula: string | null;
  studentTurma: string | null;
  score: string;
  correct: number;
  incorrect: number;
};

export type Template = {
  id: string;
  title: string;
  date: string;
  numQuestoes: number;
  correctAnswers: string[];
  results: ReportResult[];
  gabaritoImagePath?: string | null;
};

// Instância (promessa) do DB assíncrono
let dbPromise: Promise<any> | null = null;
const getDB = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("testify.db");
  }
  return dbPromise;
};

// Inicializa tabelas
export const initDB = async (): Promise<void> => {
  const db = await getDB();
  await db.runAsync(`CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    numQuestoes INTEGER NOT NULL,
    correctAnswers TEXT NOT NULL,
    gabaritoImagePath TEXT NULL
  );`);
  await db.runAsync(`CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY NOT NULL,
    templateId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    studentMatricula TEXT,
    studentTurma TEXT,
    score TEXT NOT NULL,
    correct INTEGER NOT NULL,
    incorrect INTEGER NOT NULL,
    FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
  );`);
};

// CRUD Templates
export const addTemplateDB = async (template: Template): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO templates (id, title, date, numQuestoes, correctAnswers, gabaritoImagePath)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      template.id,
      template.title,
      template.date,
      template.numQuestoes,
      JSON.stringify(template.correctAnswers),
      template.gabaritoImagePath || null,
    ]
  );
};

export const getTemplatesDB = async (): Promise<Template[]> => {
  const db = await getDB();
  const rows: any[] = await db.getAllAsync(
    "SELECT * FROM templates ORDER BY date DESC;"
  );
  const templates: Template[] = [];
  for (const t of rows) {
    const resultRows: any[] = await db.getAllAsync(
      "SELECT * FROM results WHERE templateId = ? ORDER BY studentName ASC;",
      [t.id]
    );
    const results: ReportResult[] = resultRows.map((r: any) => ({
      id: r.id,
      templateId: r.templateId,
      studentName: r.studentName,
      studentMatricula: r.studentMatricula,
      studentTurma: r.studentTurma,
      score: r.score,
      correct: r.correct,
      incorrect: r.incorrect,
    }));
    templates.push({
      id: t.id,
      title: t.title,
      date: t.date,
      numQuestoes: t.numQuestoes,
      correctAnswers: JSON.parse(t.correctAnswers || "[]"),
      results,
      gabaritoImagePath: t.gabaritoImagePath,
    });
  }
  return templates;
};

export const deleteTemplateDB = async (templateId: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync("DELETE FROM templates WHERE id = ?;", [templateId]);
};

export const addReportDB = async (
  templateId: string,
  result: { score: string; correct: number; incorrect: number },
  studentName: string,
  studentMatricula: string | null,
  studentTurma: string | null
): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO results (id, templateId, studentName, studentMatricula, studentTurma, score, correct, incorrect)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      Date.now().toString() + Math.random(),
      templateId,
      studentName || "Aluno Não Identificado",
      studentMatricula || null,
      studentTurma || null,
      result.score,
      result.correct,
      result.incorrect,
    ]
  );
};
