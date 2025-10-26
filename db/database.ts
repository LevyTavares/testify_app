import * as SQLite from "expo-sqlite";

// Tipos exportados para uso em outras partes do app (evita import circular)
export type ReportResult = {
  id: string;
  templateId: string;
  studentName: string;
  studentMatricula?: string | null;
  studentTurma?: string | null;
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
};

// Abre ou cria o banco de dados 'testify.db'
const db = SQLite.openDatabaseSync("testify.db");

// --- Funções de Inicialização ---

// Função para criar as tabelas se elas não existirem
export const initDB = () => {
  const promise = new Promise<void>(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            numQuestoes INTEGER NOT NULL,
            correctAnswers TEXT NOT NULL
          );
        `);
        await db.execAsync(`
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
      });
      resolve();
    } catch (error) {
      console.error("Erro ao inicializar o banco de dados:", error);
      reject(error);
    }
  });
  return promise;
};

// --- Funções CRUD para Templates ---

// Adiciona um novo gabarito
export const addTemplateDB = (template: Template) => {
  const promise = new Promise<any>(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO templates (id, title, date, numQuestoes, correctAnswers) VALUES (?, ?, ?, ?, ?);`,
          [
            template.id,
            template.title,
            template.date,
            template.numQuestoes,
            JSON.stringify(template.correctAnswers),
          ]
        );
      });
      resolve(true);
    } catch (error) {
      console.error("Erro ao inserir template:", error);
      reject(error);
    }
  });
  return promise;
};

// Busca todos os gabaritos (e seus resultados associados)
export const getTemplatesDB = () => {
  const promise = new Promise<Template[]>(async (resolve, reject) => {
    try {
      const templates: Template[] = [];
      // Usamos transação para poder usar await nas consultas SQL internas
      await db.withTransactionAsync(async () => {
        // 1. Busca todos os templates, ordenados pelos mais recentes
        const templateRows: any[] = await db.getAllAsync(
          "SELECT * FROM templates ORDER BY date DESC;",
          []
        );

        for (const templateRow of templateRows) {
          // 2. Busca os resultados associados a este template, ordenados por nome
          const resultsRows: any[] = await db.getAllAsync(
            "SELECT * FROM results WHERE templateId = ? ORDER BY studentName ASC;",
            [templateRow.id]
          );

          const resultsData: ReportResult[] = resultsRows as ReportResult[];

          // Monta o objeto Template completo
          templates.push({
            id: templateRow.id,
            title: templateRow.title,
            date: templateRow.date,
            numQuestoes: templateRow.numQuestoes,
            correctAnswers: JSON.parse(templateRow.correctAnswers || "[]"),
            results: resultsData,
          });
        }
      });
      resolve(templates); // Retorna a lista completa de templates com resultados
    } catch (error) {
      console.error("Erro ao buscar templates e resultados:", error);
      reject(error);
    }
  });
  return promise;
};

// --- Funções CRUD para Results ---

// Adiciona um novo resultado para um gabarito específico
export const addReportDB = (
  templateId: string,
  result: { score: string; correct: number; incorrect: number },
  studentName: string,
  studentMatricula: string,
  studentTurma: string
) => {
  const promise = new Promise<any>(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
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
      });
      resolve(true);
    } catch (error) {
      console.error("Erro ao inserir resultado:", error);
      reject(error);
    }
  });
  return promise;
};
