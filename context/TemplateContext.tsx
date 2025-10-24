import React, { createContext, useState, useContext, ReactNode } from 'react';

// 1. Definimos os Tipos de dados (baseado no que já migramos)
//
type ReportResult = {
  id: string;
  studentName: string;
  studentMatricula: string;
  studentTurma: string;
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

// 2. Definimos o que o Contexto vai fornecer (nossos estados e funções)
type TemplateContextType = {
  templates: Template[];
  handleAddTemplate: (title: string, numQuestoes: string, correctAnswers: string[]) => void;
  handleAddReport: (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => void;
};

// 3. Criamos o Contexto
const TemplateContext = createContext<TemplateContextType>(null!);

// 4. Criamos o "Provedor" (O Cérebro em si)
// Esta é a lógica 100% copiada do seu App.js original
export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  // Esta função é do seu App.js
  const handleAddTemplate = (title: string, numQuestoes: string, correctAnswers: string[]) => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      title: title,
      date: new Date().toLocaleDateString('pt-BR'),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: correctAnswers,
      results: [],
    };
    setTemplates(prevTemplates => [newTemplate, ...prevTemplates]);
  };

  // Esta função é do seu App.js
  const handleAddReport = (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => {
    setTemplates(prevTemplates => {
      return prevTemplates.map(t => {
        if (t.id === template.id) {
          const newResult: ReportResult = {
            id: Date.now().toString(),
            studentName: studentName || 'Aluno Não Identificado',
            studentMatricula: studentMatricula || 'Não informada',
            studentTurma: studentTurma || 'Não informada',
            ...result,
          };
          return { ...t, results: [newResult, ...t.results] };
        }
        return t;
      });
    });
  };

  // Disponibilizamos os estados e funções para o app
  return (
    <TemplateContext.Provider value={{ templates, handleAddTemplate, handleAddReport }}>
      {children}
    </TemplateContext.Provider>
  );
};

// 5. Criamos um "Hook" para facilitar o uso nas telas
export const useTemplates = () => {
  return useContext(TemplateContext);
};