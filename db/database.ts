import * as SQLite from 'expo-sqlite';
// Importamos o tipo 'Template' do nosso contexto para usá-lo aqui também
// Assumindo que o tipo Template está exportado de TemplateContext.tsx
// Se você moveu a definição do tipo para cá, ajuste o import no Context
import { Template } from '../context/TemplateContext';

// Abre ou cria o banco de dados 'testify.db'
const db = SQLite.openDatabase('testify.db');

// --- Funções de Inicialização ---

// Função para criar as tabelas se elas não existirem
export const initDB = () => {
  const promise = new Promise<void>((resolve, reject) => {
    db.transaction((tx) => {
      // Tabela de Gabaritos (Templates)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          date TEXT NOT NULL,
          numQuestoes INTEGER NOT NULL,
          correctAnswers TEXT NOT NULL
        );`,
        [],
        () => { /* Sucesso na criação da tabela templates */ },
        (_, error): boolean => {
          console.error("Erro ao criar tabela templates:", error);
          reject(error);
          return false; // Indica que o erro foi tratado
        }
      );

      // Tabela de Resultados (Reports/Alunos)
      // ON DELETE CASCADE garante que resultados são deletados com o template
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
          resolve(); // Sucesso na criação de ambas as tabelas
        },
        (_, error): boolean => {
          console.error("Erro ao criar tabela results:", error);
          reject(error);
          return false;
        }
      );
    });
  });
  return promise;
};

// --- Funções CRUD para Templates ---

// Adiciona um novo gabarito
export const addTemplateDB = (template: Template) => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO templates (id, title, date, numQuestoes, correctAnswers) VALUES (?, ?, ?, ?, ?);`,
        [
          template.id,
          template.title,
          template.date,
          template.numQuestoes,
          JSON.stringify(template.correctAnswers), // Salvamos o array como texto JSON
        ],
        (_, result) => { resolve(result); },
        (_, error): boolean => {
          console.error("Erro ao inserir template:", error);
          reject(error);
          return false;
        }
      );
    });
  });
  return promise;
};

// Busca todos os gabaritos (e seus resultados associados)
export const getTemplatesDB = () => {
  const promise = new Promise<Template[]>(async (resolve, reject) => {
    try {
      const templates: Template[] = [];
      await db.transactionAsync(async (tx) => {
        const templateResults = await tx.executeSqlAsync(
          'SELECT * FROM templates ORDER BY date DESC;', // Ordena pelos mais recentes
          []
        );

        if (templateResults.rows.length > 0) {
          for (let i = 0; i < templateResults.rows.length; i++) {
            const templateRow = templateResults.rows.item(i);
            const resultsResults = await tx.executeSqlAsync(
              'SELECT * FROM results WHERE templateId = ? ORDER BY studentName ASC;',
              [templateRow.id]
            );

            const resultsData = [];
            if (resultsResults.rows.length > 0) {
              for (let j = 0; j < resultsResults.rows.length; j++) {
                resultsData.push(resultsResults.rows.item(j));
              }
            }

            templates.push({
              id: templateRow.id,
              title: templateRow.title,
              date: templateRow.date,
              numQuestoes: templateRow.numQuestoes,
              correctAnswers: JSON.parse(templateRow.correctAnswers || '[]'),
              results: resultsData,
            });
          }
        }
      });
      resolve(templates);
    } catch (error) {
      console.error("Erro ao buscar templates e resultados:", error);
      reject(error);
    }
  });
  return promise;
};


// --- Função DELETE para Templates ---

// Deleta um gabarito pelo ID (e os resultados associados via CASCADE)
export const deleteTemplateDB = (templateId: string) => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM templates WHERE id = ?;`,
        [templateId],
        (_, result) => {
           console.log(`Template ${templateId} deletado do DB.`);
           resolve(result);
        },
        (_, error): boolean => {
          console.error("Erro ao deletar template:", error);
          reject(error);
          return false;
        }
      );
    });
  });
  return promise;
};


// --- Funções CRUD para Results ---

// Adiciona um novo resultado para um gabarito específico
export const addReportDB = (
  templateId: string,
  result: { score: string; correct: number; incorrect: number; },
  studentName: string,
  studentMatricula: string,
  studentTurma: string
) => {
  const promise = new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO results (id, templateId, studentName, studentMatricula, studentTurma, score, correct, incorrect)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          Date.now().toString() + Math.random(), // ID mais único
          templateId,
          studentName || 'Aluno Não Identificado',
          studentMatricula || null,
          studentTurma || null,
          result.score,
          result.correct,
          result.incorrect,
        ],
        (_, dbResult) => { resolve(dbResult); },
        (_, error): boolean => {
          console.error("Erro ao inserir resultado:", error);
          reject(error);
          return false;
        }
      );
    });
  });
  return promise;
};