import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// 1. Importe TUDO (*) do nosso serviço de banco de dados
import * as db from '../db/database';
// Importamos o tipo Template que agora está definido DENTRO de database.ts
// Usamos 'export type' lá para permitir isso.
export type { Template } from '../db/database';
import { Template } from '../db/database';

// --- Tipos ---
// Reutilizamos o tipo ReportResult aninhado dentro de Template
type ReportResult = Template['results'][0];

// O que o Contexto vai fornecer (funções agora retornam Promise<void>)
type TemplateContextType = {
  templates: Template[];
  handleAddTemplate: (title: string, numQuestoes: string, correctAnswers: string[]) => Promise<void>;
  handleAddReport: (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => Promise<void>;
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
        // Em um app real, mostraríamos um erro para o usuário aqui
      } finally {
        setIsLoading(false); // Terminou de carregar (com sucesso ou erro)
      }
    };
    setupAndLoadDB();
  }, []); // [] significa: rodar apenas uma vez quando o componente monta

  // FUNÇÃO handleAddTemplate AGORA USA O DB
  const handleAddTemplate = async (title: string, numQuestoes: string, correctAnswers: string[]) => {
    // 1. Cria o objeto do novo template (lógica do App.js original)
    const newTemplateData: Template = {
      id: Date.now().toString(),
      title: title,
      date: new Date().toLocaleDateString('pt-BR'),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: correctAnswers,
      results: [],
    };
    try {
      // 2. Chama a função do database.ts para salvar no SQLite
      await db.addTemplateDB(newTemplateData);
      console.log("Template salvo no DB:", newTemplateData.title);
      // 3. Atualiza o estado local para a UI refletir a mudança imediatamente
      // Adiciona o novo template no início da lista
      setTemplates(prevTemplates => [newTemplateData, ...prevTemplates]);
    } catch (err) {
      console.error("Erro ao salvar gabarito no DB:", err);
      // Mostrar erro para o usuário? (Ex: alert('Erro ao salvar gabarito'))
    }
  };

  // FUNÇÃO handleAddReport AGORA USA O DB
  const handleAddReport = async (template: Template, result: { score: string; correct: number; incorrect: number; }, studentName: string, studentMatricula: string, studentTurma: string) => {
    try {
      // 1. Chama a função do database.ts para salvar o resultado no SQLite
      await db.addReportDB(template.id, result, studentName, studentMatricula, studentTurma);
      console.log("Resultado salvo no DB para:", studentName);
      // 2. Recarrega TODOS os templates do DB para atualizar a UI
      // (Poderia ser otimizado para atualizar apenas o template modificado,
      // mas recarregar tudo é mais simples e garante consistência)
      const updatedTemplates = await db.getTemplatesDB();
      setTemplates(updatedTemplates);
    } catch (err) {
      console.error("Erro ao salvar resultado no DB:", err);
      // Mostrar erro para o usuário?
    }
  };

  // Fornecemos o estado de loading junto com o resto
  return (
    <TemplateContext.Provider value={{ templates, handleAddTemplate, handleAddReport, isLoading }}>
      {children}
    </TemplateContext.Provider>
  );
};

// Hook para usar o contexto (igual)
export const useTemplates = () => {
  return useContext(TemplateContext);
};