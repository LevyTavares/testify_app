// db/database.ts - VERSÃO COMPLETA E LIMPA

// Usamos a importação de namespace, que é a mais comum
// Usamos a API "legacy" síncrona do expo-sqlite, que expõe openDatabase
// Isso evita o erro "openDatabase is not a function" nas versões novas do Expo.
import * as SQLite from "expo-sqlite/legacy";
// Removemos importações de tipos específicos para evitar incompatibilidades de namespace entre versões do Expo.

// --- DEFINIÇÃO DOS TIPOS (Definidos UMA VEZ AQUI) ---
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
  results: ReportResult[]; // Usa o tipo ReportResult definido acima
  gabaritoImagePath?: string | null; // Incluindo o campo de imagem que adicionamos
};
// --- FIM DA DEFINIÇÃO DOS TIPOS ---

// --- Abertura do Banco de Dados ---
const db = SQLite.openDatabase("testify.db"); // <-- Usando SQLite.openDatabase

// --- Funções de Inicialização ---
export const initDB = () => {
  const promise = new Promise<void>((resolve, reject) => {
    db.transaction((tx: any) => {
      // Tabela Templates
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          numQuestoes INTEGER NOT NULL,
          correctAnswers TEXT NOT NULL,
          gabaritoImagePath TEXT NULL
        );`, // <-- Coluna da imagem
        [],
        () => {},
        (_: unknown, error: unknown): boolean => {
          console.error("Erro ao criar tabela templates:", error);
          reject(error as Error);
          return false;
        }
      );

      // Tabela Results
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS results (
          id TEXT PRIMARY KEY NOT NULL,
          templateId TEXT NOT NULL,
          studentName TEXT NOT NULL,
          studentMatricula TEXT,
          studentTurma TEXT,
          score TEXT NOT NULL,
          correct INTEGER NOT NULL,
          incorrect INTEGER NOT NULL,
          FOREIGN KEY (templateId) REFERENCES templates(id) ON DELETE CASCADE
        );`,
        [],
        () => {
          resolve();
        },
        (_: unknown, error: unknown): boolean => {
          console.error("Erro ao criar tabela results:", error);
          reject(error as Error);
          return false;
        }
      );
    });
  });
  return promise;
};

// --- Funções CRUD para Templates ---
export const addTemplateDB = (template: Template) => {
  const promise = new Promise<any>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO templates (id, title, date, numQuestoes, correctAnswers, gabaritoImagePath) VALUES (?, ?, ?, ?, ?, ?);`,
        [
          template.id,
          template.title,
          template.date,
          template.numQuestoes,
          JSON.stringify(template.correctAnswers),
          template.gabaritoImagePath || null,
        ],
        (_: unknown, result: unknown) => {
          resolve(result);
        },
        (_: unknown, error: unknown): boolean => {
          console.error("Erro ao inserir template:", error);
          reject(error as Error);
          return false;
        }
      );
    });
  });
  return promise;
};

export const getTemplatesDB = () => {
  const promise = new Promise<Template[]>((resolve, reject) => {
    try {
      db.readTransaction((tx: any) => {
        tx.executeSql(
          "SELECT * FROM templates ORDER BY date DESC;",
          [],
          (_: unknown, tmplResult: any) => {
            const templates: Template[] = [];
            const rows = tmplResult?.rows;
            const rowCount = rows?.length ?? rows?._array?.length ?? 0;
            const rowsArray: any[] = rows?._array ?? rows ?? [];

            if (rowCount === 0) {
              resolve([]);
              return;
            }

            let processed = 0;
            rowsArray.forEach((templateRow) => {
              tx.executeSql(
                "SELECT * FROM results WHERE templateId = ? ORDER BY studentName ASC;",
                [templateRow.id],
                (_2: unknown, resResult: any) => {
                  const resRows = resResult?.rows;
                  const resArray: any[] = resRows?._array ?? resRows ?? [];
                  const resultsData: ReportResult[] = resArray.map(
                    (row: any) => ({
                      id: row.id,
                      templateId: row.templateId,
                      studentName: row.studentName,
                      studentMatricula: row.studentMatricula,
                      studentTurma: row.studentTurma,
                      score: row.score,
                      correct: row.correct,
                      incorrect: row.incorrect,
                    })
                  );

                  templates.push({
                    id: templateRow.id,
                    title: templateRow.title,
                    date: templateRow.date,
                    numQuestoes: templateRow.numQuestoes,
                    correctAnswers: JSON.parse(
                      templateRow.correctAnswers || "[]"
                    ),
                    results: resultsData,
                    gabaritoImagePath: templateRow.gabaritoImagePath,
                  });

                  processed += 1;
                  if (processed === rowCount) {
                    resolve(templates);
                  }
                },
                (_2: unknown, error: unknown) => {
                  console.error("Erro ao buscar resultados:", error);
                  reject(error as Error);
                  return false;
                }
              );
            });
          },
          (_: unknown, error: unknown) => {
            console.error("Erro ao buscar templates:", error);
            reject(error as Error);
            return false;
          }
        );
      });
    } catch (error) {
      reject(error as Error);
    }
  });
  return promise;
};

export const deleteTemplateDB = (templateId: string) => {
  const promise = new Promise<any>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `DELETE FROM templates WHERE id = ?;`,
        [templateId],
        (_: unknown, result: unknown) => {
          console.log(`Template ${templateId} deletado do DB.`);
          resolve(result);
        },
        (_: unknown, error: unknown): boolean => {
          console.error("Erro ao deletar template:", error);
          reject(error as Error);
          return false;
        }
      );
    });
  });
  return promise;
};

// --- Funções CRUD para Results ---
export const addReportDB = (
  templateId: string,
  result: { score: string; correct: number; incorrect: number },
  studentName: string,
  studentMatricula: string | null,
  studentTurma: string | null
) => {
  const promise = new Promise<any>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
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
        ],
        (_: unknown, dbResult: unknown) => {
          resolve(dbResult);
        },
        (_: unknown, error: unknown): boolean => {
          console.error("Erro ao inserir resultado:", error);
          reject(error as Error);
          return false;
        }
      );
    });
  });
  return promise;
};
