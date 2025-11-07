import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as db from '../db/database';
// --- MUDANÇA AQUI ---
// Importamos o tipo Template que AGORA VEM de database.ts
import { Template } from '../db/database';
// Removemos: export type { Template } from '../db/database';

// --- O resto do arquivo (Tipos, ContextType, Provider, Hook) permanece o mesmo ---
// ... (Cole o restante do código do TemplateContext.tsx aqui,
//      exatamente como estava na minha resposta anterior) ...

// --- Tipos ---
type ReportResult = Template['results'][0];

type TemplateContextType = {
  templates: Template[];
  handleAddTemplate: (title: string, numQuestoes: string, correctAnswers: string[]) => Promise<void>;
  handleAddReport: (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string | null, studentTurma: string | null) => Promise<void>; // Aceita null
  handleDeleteTemplate: (templateId: string) => Promise<void>;
  isLoading: boolean;
};

const TemplateContext = createContext<TemplateContextType>(null!);

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupAndLoadDB = async () => {
      setIsLoading(true);
      try {
        await db.initDB();
        console.log("Banco de dados inicializado.");
        const loadedTemplates = await db.getTemplatesDB();
        console.log("Templates carregados:", loadedTemplates.length);
        setTemplates(loadedTemplates);
      } catch (err) {
        console.error("Erro CRÍTICO ao inicializar/carregar DB:", err);
      } finally {
        setIsLoading(false);
      }
    };
    setupAndLoadDB();
  }, []);

  const handleAddTemplate = async (title: string, numQuestoes: string, correctAnswers: string[]) => {
    const newTemplateData: Template = {
      id: Date.now().toString(),
      title: title,
      date: new Date().toLocaleDateString('pt-BR'),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: correctAnswers,
      results: [],
    };
    try {
      await db.addTemplateDB(newTemplateData);
      console.log("Template salvo no DB:", newTemplateData.title);
      setTemplates(prevTemplates => [newTemplateData, ...prevTemplates]);
    } catch (err) {
      console.error("Erro ao salvar gabarito no DB:", err);
      throw err;
    }
  };

  // Ajustado para aceitar null nos tipos
  const handleAddReport = async (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string | null, studentTurma: string | null) => {
    try {
      await db.addReportDB(template.id, result, studentName, studentMatricula, studentTurma);
      console.log("Resultado salvo no DB para:", studentName);
      const updatedTemplates = await db.getTemplatesDB();
      setTemplates(updatedTemplates);
    } catch (err) {
      console.error("Erro ao salvar resultado no DB:", err);
      throw err;
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await db.deleteTemplateDB(templateId);
      console.log("Template deletado do DB via Context:", templateId);
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    } catch (err) {
      console.error("Erro ao deletar gabarito no Context:", err);
      throw err;
    }
  };

  return (
    <TemplateContext.Provider value={{
        templates,
        handleAddTemplate,
        handleAddReport,
        handleDeleteTemplate,
        isLoading
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = () => {
  return useContext(TemplateContext);
};