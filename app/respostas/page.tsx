"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";

interface QuestionOption {
  id: string;
  value: string;
  label: string;
}

interface Question {
  id: string;
  question: string;
  type: string;
  options: QuestionOption[];
}

interface Response {
  question: Question;
  answer: string;
}

interface UserResponse {
  user: {
    id: string;
    name: string;
    discordId: string;
    image: string;
  };
  responses: Response[];
  submittedAt: string;
}

export default function ResponsesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (session && session.user.role !== "READER" && session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);
  
  useEffect(() => {
    if (session && (session.user.role === "READER" || session.user.role === "ADMIN")) {
      fetchResponses();
    }
  }, [session]);
  
  const fetchResponses = async () => {
    try {
      const res = await fetch("/api/form/responses");
      if (res.ok) {
        const data = await res.json();
        setResponses(data);
      } else {
        const error = await res.json();
        setError(error.error || "Erro ao buscar respostas");
      }
    } catch (error) {
      setError("Erro ao buscar respostas");
    } finally {
      setLoading(false);
    }
  };
  
  const filteredResponses = responses.filter((userResponse) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      userResponse.user.name?.toLowerCase().includes(search) ||
      userResponse.user.discordId.toLowerCase().includes(search)
    );
  });
  
  const handleDeleteResponse = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja deletar todas as respostas de ${userName}?`)) return;
    
    try {
      const res = await fetch(`/api/form/responses?userId=${userId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setResponses(responses.filter(r => r.user.id !== userId));
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao deletar respostas");
      }
    } catch (error) {
      alert("Erro ao deletar respostas");
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
  
  if (error) {
    return (
      <>
        <Navigation />
        <div className="px-4 py-6">
          <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navigation />
      <div className="px-4 py-6 flex justify-center">
        <div className="w-3/4">
          <div className="bg-[#36393f] rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">
              Respostas do Formulário
            </h1>
            
            {/* Campo de busca */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome ou Discord ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-[#40444b] text-gray-200 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="mt-2 text-sm text-gray-400">
                  {filteredResponses.length} {filteredResponses.length === 1 ? "resultado encontrado" : "resultados encontrados"}
                </p>
              )}
            </div>
            
            {filteredResponses.length === 0 ? (
              <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-8 text-center text-gray-300">
                {searchTerm ? "Nenhuma resposta encontrada com esse termo de busca." : "Nenhuma resposta enviada ainda."}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResponses.map((userResponse) => (
                  <div key={userResponse.user.id} className="bg-[#2f3136] rounded-lg border border-gray-600 p-6">
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-600">
                      {userResponse.user.image && (
                        <img
                          src={userResponse.user.image}
                          alt={userResponse.user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">
                          {userResponse.user.name}
                        </h2>
                        <p className="text-sm text-gray-400">
                          Discord ID: {userResponse.user.discordId} • 
                          Enviado em: {new Date(userResponse.submittedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      {session?.user.role === "ADMIN" && (
                        <button
                          onClick={() => handleDeleteResponse(userResponse.user.id, userResponse.user.name)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          title="Deletar resposta"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Deletar
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {userResponse.responses.map((response, index) => (
                        <div key={index} className="border-l-4 border-[#5865F2] pl-4">
                          <p className="font-semibold text-gray-200 mb-1">
                            {response.question.question}
                          </p>
                          <p className="text-gray-300">
                            {response.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
