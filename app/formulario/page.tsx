"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";

type QuestionType = "TEXT" | "TEXTAREA" | "RADIO" | "CHECKBOX" | "SELECT";

interface QuestionOption {
  id: string;
  value: string;
  label: string;
}

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: QuestionOption[];
}

export default function FormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  useEffect(() => {
    fetchQuestions();
    fetchUserResponses();
  }, []);
  
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions");
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserResponses = async () => {
    try {
      const res = await fetch("/api/form/submit");
      if (res.ok) {
        const data = await res.json();
        const responsesMap: Record<string, string> = {};
        data.forEach((response: any) => {
          responsesMap[response.questionId] = response.answer;
        });
        setAnswers(responsesMap);
      }
    } catch (error) {
      console.error("Erro ao buscar respostas:", error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    
    try {
      // Validar campos obrigatórios
      const requiredQuestions = questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        if (!answers[question.id] || answers[question.id].trim() === "") {
          setMessage({ type: "error", text: `A pergunta "${question.question}" é obrigatória` });
          setSubmitting(false);
          return;
        }
      }
      
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      
      const res = await fetch("/api/form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      
      if (res.ok) {
        setAnswers({}); // Limpar todos os campos
        setShowSuccessModal(true); // Mostrar modal de sucesso
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Erro ao enviar formulário" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao enviar formulário" });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || "";
    
    switch (question.type) {
      case "TEXT":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent placeholder-gray-400"
            required={question.required}
          />
        );
        
      case "TEXTAREA":
        return (
          <textarea
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent placeholder-gray-400"
            required={question.required}
          />
        );
        
      case "RADIO":
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="w-4 h-4 text-[#5865F2]"
                  required={question.required}
                />
                <span className="text-gray-200">{option.label}</span>
              </label>
            ))}
          </div>
        );
        
      case "CHECKBOX":
        const checkboxValues = value ? value.split(",") : [];
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={checkboxValues.includes(option.value)}
                  onChange={(e) => {
                    let newValues = [...checkboxValues];
                    if (e.target.checked) {
                      newValues.push(option.value);
                    } else {
                      newValues = newValues.filter(v => v !== option.value);
                    }
                    setAnswers({ ...answers, [question.id]: newValues.join(",") });
                  }}
                  className="w-4 h-4 text-[#5865F2]"
                />
                <span className="text-gray-200">{option.label}</span>
              </label>
            ))}
          </div>
        );
        
      case "SELECT":
        return (
          <select
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
            required={question.required}
          >
            <option value="">Selecione uma opção</option>
            {question.options.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      default:
        return null;
    }
  };
  
  if (status === "loading" || loading) {
    return (
      <>
        <Navigation />
        <div className="px-4 py-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-[#2f3136] rounded-lg p-8 border border-gray-600">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#5865F2] mx-auto"></div>
            <p className="mt-4 text-white text-lg font-medium">Carregando...</p>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="px-4 py-6">
        <div className="max-w-3/4 mx-auto">
          <div className="bg-[#36393f] rounded-lg shadow-md p-8">
            {/* Card Informativo */}
            <div className="bg-[#2f3136] border border-gray-600 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Projetos CPX XP</h2>
              <div className="text-gray-300 space-y-3 leading-relaxed">
                <p>
                  Este formulário tem como objetivo cadastrar e avaliar projetos de grupos ilegais para atuação dentro do servidor CPX XP. Para que a proposta seja considerada, é necessário que o grupo tenha no mínimo 20 membros ativos, e que o LÍDER possua idade mínima de 18 anos.
                </p>
                <p>
                  👉 Projetos voltados para RESTAURANTES deverão contar com no mínimo 5 integrantes, e o projeto deverá apresentar toda a estrutura do restaurante, incluindo organização interna, funcionamento, cargos/funções, proposta temática e forma de atuação dentro do servidor.
                </p>
                <p>
                  O projeto deverá ser enviado obrigatoriamente em Google Docs, sendo aceitos apenas links com acesso liberado para visualização pela equipe do elenco. Outros formatos de envio não serão considerados.
                </p>
                <p>
                  A aprovação deste formulário não garante o ingresso direto como facção oficial no servidor. Caso o projeto seja aprovado na análise inicial, o grupo deverá obrigatoriamente passar pelo processo da Pista, onde será avaliado dentro do jogo antes de qualquer possível oficialização.
                </p>
                <p>
                  Agradecemos o interesse e desejamos boa sorte no processo.
                </p>
                <p className="mt-4 text-gray-400 italic">
                  Att,<br />
                  Equipe do Elenco CPX XP
                </p>
              </div>
            </div>
            
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
            
            {questions.length === 0 ? (
              <p className="text-gray-300 text-center py-8">
                Nenhuma pergunta cadastrada ainda. Aguarde um administrador adicionar perguntas.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-600 pb-6 last:border-0">
                    <label className="block mb-2">
                      <span className="text-lg font-semibold text-gray-100">
                        {index + 1}. {question.question}
                        {question.required && <span className="text-red-400 ml-1">*</span>}
                      </span>
                    </label>
                    {renderQuestion(question)}
                  </div>
                ))}
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#5865F2] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#4752C4] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Enviando..." : "Enviar Respostas"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Parabéns!</h2>
            <p className="text-gray-300 mb-6">Você enviou o formulário com sucesso!</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
