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
            
            {responses.length === 0 ? (
              <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-8 text-center text-gray-300">
                Nenhuma resposta enviada ainda.
              </div>
            ) : (
              <div className="space-y-6">
                {responses.map((userResponse) => (
                  <div key={userResponse.user.id} className="bg-[#2f3136] rounded-lg border border-gray-600 p-6">
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-600">
                      {userResponse.user.image && (
                        <img
                          src={userResponse.user.image}
                          alt={userResponse.user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          {userResponse.user.name}
                        </h2>
                        <p className="text-sm text-gray-400">
                          Discord ID: {userResponse.user.discordId} • 
                          Enviado em: {new Date(userResponse.submittedAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
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
