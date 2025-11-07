// context/TemplateContext.tsx - VERSÃO CORRIGIDA

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as db from '../db/database';
// --- MUDANÇA: Importa os tipos do arquivo DB ---
import { Template, ReportResult } from '../db/database';
// Re-exporta para as telas (boa prática)
export type { Template, ReportResult } from '../db/database';


// --- Tipos ---
// O que o Contexto vai fornecer
type TemplateContextType = {
  templates: Template[];
  // Ajustado para aceitar o caminho da imagem
  handleAddTemplate: (title: string, numQuestoes: string, correctAnswers: string[], gabaritoImagePath: string | null) => Promise<void>;
  handleAddReport: (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string | null, studentTurma: string | null) => Promise<void>;
  handleDeleteTemplate: (templateId: string) => Promise<void>;
  isLoading: boolean;
};

const TemplateContext = createContext<TemplateContextType>(null!);

// O Provedor (Cérebro)
export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // EFEITO PARA INICIAR O DB E CARREGAR DADOS
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

  // FUNÇÃO handleAddTemplate
  const handleAddTemplate = async (
    title: string,
    numQuestoes: string,
    correctAnswers: string[],
    gabaritoImagePath: string | null // <-- Aceita o caminho
  ) => {
    const newTemplateData: Template = {
      id: Date.now().toString(),
      title: title,
      date: new Date().toLocaleDateString('pt-BR'),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: correctAnswers,
      results: [],
      gabaritoImagePath: gabaritoImagePath, // <-- Passa o caminho
    };
    try {
      await db.addTemplateDB(newTemplateData);
      console.log("Template salvo no DB com caminho da imagem:", newTemplateData.title);
      setTemplates(prevTemplates => [newTemplateData, ...prevTemplates]);
    } catch (err) {
      console.error("Erro ao salvar gabarito no DB:", err);
      throw err;
    }
  };

  // FUNÇÃO handleAddReport
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

  // FUNÇÃO handleDeleteTemplate
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

  // Fornece os valores
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

// Hook para usar o contexto
export const useTemplates = () => {
  return useContext(TemplateContext);
};