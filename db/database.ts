// db/database.ts - VERSÃO FINAL (Sem tipos duplicados)

import * as SQLite from "expo-sqlite";

// --- DEFINIÇÃO DOS TIPOS (Definidos UMA VEZ AQUI e exportados) ---
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
  // Caminho permanente (file://...) da imagem do gabarito salva em FileSystem.documentDirectory
  // Pode ser null se a geração da imagem falhar ou ainda não ocorrer
  gabaritoImagePath?: string | null;
  // Caminho do JSON de mapa de posições gerado pelo backend
  mapPath: string;
  results: ReportResult[]; // Usa o tipo ReportResult definido acima
};
// --- FIM DA DEFINIÇÃO DOS TIPOS ---

// --- Abertura do Banco de Dados ---
// SDK 54+ usa a nova API síncrona/assíncrona
const db = SQLite.openDatabaseSync("testify.db");

// --- Funções de Inicialização (com tipos explícitos) ---
export const initDB = async () => {
  // Cria as tabelas se não existirem
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      numQuestoes INTEGER NOT NULL,
      correctAnswers TEXT NOT NULL,
      gabaritoImagePath TEXT NULL,
      mapPath TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY NOT NULL,
      templateId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentMatricula TEXT,
      studentTurma TEXT,
      score TEXT NOT NULL,
      correct INTEGER NOT NULL,
      incorrect INTEGER NOT NULL,
      FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
    );
  `);

  // MIGRAÇÃO: garante que a coluna gabaritoImagePath exista mesmo em bancos antigos
  try {
    const columns: Array<{ name: string }> = await db.getAllAsync(
      `PRAGMA table_info(templates);`
    );
    const hasImagePath = columns.some((c) => c.name === "gabaritoImagePath");
    if (!hasImagePath) {
      await db.execAsync(
        `ALTER TABLE templates ADD COLUMN gabaritoImagePath TEXT;`
      );
      console.log("Coluna gabaritoImagePath adicionada via migração.");
    }

    // MIGRAÇÃO: adiciona a coluna mapPath se não existir
    const hasMapPath = columns.some((c) => c.name === "mapPath");
    if (!hasMapPath) {
      await db.execAsync(`ALTER TABLE templates ADD COLUMN mapPath TEXT;`);
      // Define valor padrão vazio para registros existentes
      await db.execAsync(
        `UPDATE templates SET mapPath = '' WHERE mapPath IS NULL;`
      );
      console.log("Coluna mapPath adicionada via migração.");
    }
  } catch (e) {
    console.warn(
      "Não foi possível verificar/adicionar coluna gabaritoImagePath:",
      e
    );
  }
};

// --- Funções CRUD para Templates (com tipos explícitos) ---
export const addTemplateDB = async (template: Template) => {
  const res = await db.runAsync(
    `INSERT INTO templates (id, title, date, numQuestoes, correctAnswers, gabaritoImagePath, mapPath) VALUES ($id, $title, $date, $num, $answers, $gabaritoImagePath, $mapPath);`,
    {
      $id: template.id,
      $title: template.title,
      $date: template.date,
      $num: template.numQuestoes,
      $answers: JSON.stringify(template.correctAnswers),
      $gabaritoImagePath: template.gabaritoImagePath || null,
      $mapPath: template.mapPath ?? "",
    }
  );
  return res;
};

export const getTemplatesDB = async () => {
  const templates: Template[] = [];
  type TemplateRow = {
    id: string;
    title: string;
    date: string;
    numQuestoes: number;
    correctAnswers: string;
    gabaritoImagePath: string | null;
    mapPath: string | null;
  };
  type ResultRow = ReportResult;

  const templateRows: TemplateRow[] = await db.getAllAsync(
    "SELECT id, title, date, numQuestoes, correctAnswers, gabaritoImagePath, mapPath FROM templates ORDER BY date DESC;",
    []
  );

  for (const templateRow of templateRows) {
    const resultRows: ResultRow[] = await db.getAllAsync(
      "SELECT id, templateId, studentName, studentMatricula, studentTurma, score, correct, incorrect FROM results WHERE templateId = $id ORDER BY studentName ASC;",
      { $id: templateRow.id }
    );

    templates.push({
      id: templateRow.id,
      title: templateRow.title,
      date: templateRow.date,
      numQuestoes: templateRow.numQuestoes,
      correctAnswers: JSON.parse(templateRow.correctAnswers || "[]"),
      gabaritoImagePath: templateRow.gabaritoImagePath ?? null,
      mapPath: templateRow.mapPath ?? "",
      results: resultRows ?? [],
    });
  }

  return templates;
};

export const deleteTemplateDB = async (templateId: string) => {
  const res = await db.runAsync("DELETE FROM templates WHERE id = $id;", {
    $id: templateId,
  });
  return res;
};

// --- Funções CRUD para Results (com tipos explícitos) ---
export const addReportDB = async (
  templateId: string,
  result: { score: string; correct: number; incorrect: number },
  studentName: string,
  studentMatricula: string | null,
  studentTurma: string | null
) => {
  const res = await db.runAsync(
    `INSERT INTO results (id, templateId, studentName, studentMatricula, studentTurma, score, correct, incorrect)
     VALUES ($id, $templateId, $studentName, $studentMatricula, $studentTurma, $score, $correct, $incorrect);`,
    {
      $id: Date.now().toString() + Math.random(),
      $templateId: templateId,
      $studentName: studentName || "Aluno Não Identificado",
      $studentMatricula: studentMatricula || null,
      $studentTurma: studentTurma || null,
      $score: result.score,
      $correct: result.correct,
      $incorrect: result.incorrect,
    }
  );
  return res;
};
