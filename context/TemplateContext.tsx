import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// Importa TUDO (*) do nosso serviço de banco de dados
import * as db from '../db/database';
// Importamos o tipo Template que agora está definido DENTRO de database.ts
// Usamos 'export type' lá para permitir isso.
// Exportamos novamente para que as telas possam importar daqui
export type { Template } from '../db/database';
import { Template } from '../db/database';

// --- Tipos ---
// Reutilizamos o tipo ReportResult aninhado dentro de Template
type ReportResult = Template['results'][0];

// O que o Contexto vai fornecer (incluindo handleDeleteTemplate)
type TemplateContextType = {
  templates: Template[];
  handleAddTemplate: (title: string, numQuestoes: string, correctAnswers: string[]) => Promise<void>;
  handleAddReport: (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => Promise<void>;
  handleDeleteTemplate: (templateId: string) => Promise<void>; // <-- Nova função
  isLoading: boolean; // Para saber se está carregando do DB
};

// Criação do Contexto (igual)
const TemplateContext = createContext<TemplateContextType>(null!);

// O Provedor (Cérebro) - AGORA USA O SQLITE
export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  // Estado para guardar os templates LIDOS do DB
  const [templates, setTemplates] = useState<Template[]>([]);
  // Estado para indicar carregamento inicial do DB
  const [isLoading, setIsLoading] = useState(true);

  // EFEITO PARA INICIAR O DB E CARREGAR DADOS NO INÍCIO
  useEffect(() => {
    const setupAndLoadDB = async () => {
      setIsLoading(true); // Começa a carregar
      try {
        await db.initDB(); // Garante que as tabelas existem
        console.log("Banco de dados inicializado.");
        const loadedTemplates = await db.getTemplatesDB(); // Carrega os templates do SQLite
        console.log("Templates carregados:", loadedTemplates.length);
        setTemplates(loadedTemplates); // Coloca os templates no estado
      } catch (err) {
        console.error("Erro CRÍTICO ao inicializar/carregar DB:", err);
      } finally {
        setIsLoading(false); // Terminou de carregar
      }
    };
    setupAndLoadDB();
  }, []); // [] significa: rodar apenas uma vez

  // FUNÇÃO handleAddTemplate AGORA USA O DB
  const handleAddTemplate = async (title: string, numQuestoes: string, correctAnswers: string[]) => {
    // 1. Cria o objeto do novo template
    const newTemplateData: Template = {
      id: Date.now().toString(),
      title: title,
      date: new Date().toLocaleDateString('pt-BR'),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: correctAnswers,
      results: [],
    };
    try {
      // 2. Salva no SQLite
      await db.addTemplateDB(newTemplateData);
      console.log("Template salvo no DB:", newTemplateData.title);
      // 3. Atualiza o estado local
      setTemplates(prevTemplates => [newTemplateData, ...prevTemplates]);
    } catch (err) {
      console.error("Erro ao salvar gabarito no DB:", err);
      // Lançar erro ou mostrar alerta
      throw err; // Lança o erro para a tela poder tratar se quiser
    }
  };

  // FUNÇÃO handleAddReport AGORA USA O DB
  const handleAddReport = async (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => {
    try {
      // 1. Salva no SQLite
      await db.addReportDB(template.id, result, studentName, studentMatricula, studentTurma);
      console.log("Resultado salvo no DB para:", studentName);
      // 2. Recarrega TODOS os templates do DB para atualizar a UI
      const updatedTemplates = await db.getTemplatesDB();
      setTemplates(updatedTemplates);
    } catch (err) {
      console.error("Erro ao salvar resultado no DB:", err);
      // Lançar erro ou mostrar alerta
      throw err;
    }
  };

  // --- NOVA FUNÇÃO handleDeleteTemplate ---
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // 1. Deleta do SQLite
      await db.deleteTemplateDB(templateId);
      console.log("Template deletado do DB via Context:", templateId);
      // 2. Atualiza o estado local REMOVENDO o gabarito
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    } catch (err) {
      console.error("Erro ao deletar gabarito no Context:", err);
      // Lançar erro ou mostrar alerta
      throw err;
    }
  };
  // --- FIM DA NOVA FUNÇÃO ---


  // Fornecemos todos os valores (incluindo a nova função e o loading)
  return (
    <TemplateContext.Provider value={{
        templates,
        handleAddTemplate,
        handleAddReport,
        handleDeleteTemplate, // <-- Disponibiliza a função
        isLoading
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

// Hook para usar o contexto (igual)
export const useTemplates = () => {
  return useContext(TemplateContext);
};