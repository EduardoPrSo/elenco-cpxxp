"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Pencil, Trash2 } from "lucide-react";

type Role = "USER" | "READER" | "ADMIN";
type QuestionType = "TEXT" | "TEXTAREA" | "RADIO" | "CHECKBOX" | "SELECT";

interface User {
  id: string;
  name?: string;
  discordId: string;
  role: Role;
  createdAt: string;
}

interface PreConfiguredRole {
  id: string;
  discordId: string;
  role: Role;
  createdAt: string;
}

interface QuestionOption {
  id?: string;
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

interface Webhook {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "questions" | "webhooks">("users");
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [preConfiguredRoles, setPreConfiguredRoles] = useState<PreConfiguredRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ discordId: '', role: 'USER' as Role });
  const [editingUserRole, setEditingUserRole] = useState<{ id: string; role: Role; type: 'user' | 'preconfigured' } | null>(null);
  
  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);
  
  useEffect(() => {
    if (session && session.user.role === "ADMIN") {
      fetchUsers();
      fetchQuestions();
      fetchWebhooks();
    }
  }, [session]);
  
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPreConfiguredRoles(data.preConfiguredRoles || []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };
  
  const handleAddUser = async () => {
    if (!newUserData.discordId) {
      alert('Discord ID é obrigatório');
      return;
    }
    
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      
      if (res.ok) {
        setShowUserForm(false);
        setNewUserData({ discordId: '', role: 'USER' });
        fetchUsers();
      }
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
    }
  };
  
  const handleEditRole = async () => {
    if (!editingUserRole) return;
    
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUserRole),
      });
      
      if (res.ok) {
        setEditingUserRole(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Erro ao editar role:", error);
    }
  };
  
  const deletePreConfiguredRole = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta role pré-configurada?')) return;
    
    try {
      const res = await fetch(`/api/admin/roles?id=${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Erro ao remover role:", error);
    }
  };
  
  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pergunta?")) return;
    
    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error("Erro ao deletar pergunta:", error);
    }
  };
  
  const handleQuestionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const questionData = {
      id: editingQuestion?.id,
      question: formData.get("question") as string,
      type: formData.get("type") as QuestionType,
      required: formData.get("required") === "on",
      options: [] as QuestionOption[],
    };
    
    // Parse options if type requires them
    if (["RADIO", "CHECKBOX", "SELECT"].includes(questionData.type)) {
      const optionsStr = formData.get("options") as string;
      if (optionsStr) {
        questionData.options = optionsStr.split("\n").map((line) => {
          const [value, label] = line.split("|").map(s => s.trim());
          return { value: value || label, label };
        }).filter(opt => opt.label);
      }
    }
    
    try {
      const url = "/api/admin/questions";
      const method = editingQuestion ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      
      if (res.ok) {
        fetchQuestions();
        setShowQuestionForm(false);
        setEditingQuestion(null);
      }
    } catch (error) {
      console.error("Erro ao salvar pergunta:", error);
    }
  };
  
  // Webhooks functions
  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/admin/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (error) {
      console.error("Erro ao buscar webhooks:", error);
    } finally {
      setLoadingWebhooks(false);
    }
  };
  
  const handleWebhookSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const webhookData = {
      id: editingWebhook?.id,
      name: formData.get("name") as string,
      url: formData.get("url") as string,
    };
    
    try {
      const url = "/api/admin/webhooks";
      const method = editingWebhook ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData),
      });
      
      if (res.ok) {
        fetchWebhooks();
        setShowWebhookForm(false);
        setEditingWebhook(null);
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao salvar webhook");
      }
    } catch (error) {
      console.error("Erro ao salvar webhook:", error);
      alert("Erro ao salvar webhook");
    }
  };
  
  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: webhookId, isActive }),
      });
      
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Erro ao atualizar webhook:", error);
    }
  };
  
  const deleteWebhook = async (webhookId: string) => {
    if (!confirm("Tem certeza que deseja deletar este webhook?")) return;
    
    try {
      const res = await fetch(`/api/admin/webhooks?id=${webhookId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Erro ao deletar webhook:", error);
    }
  };
  
  if (status === "loading") {
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
      <div className="px-4 py-6 flex justify-center">
        <div className="w-3/4">
          <div className="bg-[#36393f] rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6 text-white">Painel Administrativo</h1>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === "users"
                    ? "bg-[#5865F2] text-white"
                    : "bg-[#40444b] text-gray-300 hover:bg-[#4f545c]"
                }`}
              >
                Gerenciar Usuários
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === "questions"
                    ? "bg-[#5865F2] text-white"
                    : "bg-[#40444b] text-gray-300 hover:bg-[#4f545c]"
                }`}
              >
                Gerenciar Perguntas
              </button>
              <button
                onClick={() => setActiveTab("webhooks")}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeTab === "webhooks"
                    ? "bg-[#5865F2] text-white"
                    : "bg-[#40444b] text-gray-300 hover:bg-[#4f545c]"
                }`}
              >
                Webhooks Discord
              </button>
            </div>
          
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Gerenciar Permissões</h2>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Adicionar Usuário
                </button>
              </div>
              
              {loadingUsers ? (
                <p className="text-center text-gray-300">Carregando...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#202225]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Discord ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Criado em</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {/* Usuários cadastrados */}
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-[#36393f]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200">{user.discordId}</span>
                              {user.name && (
                                <span className="text-xs text-gray-400">({user.name})</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              user.role === 'ADMIN' ? 'bg-red-600/20 text-red-400' :
                              user.role === 'READER' ? 'bg-blue-600/20 text-blue-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setEditingUserRole({ id: user.id, role: user.role, type: 'user' })}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Roles pré-configuradas */}
                      {preConfiguredRoles.map((roleConfig) => (
                        <tr key={roleConfig.id} className="hover:bg-[#36393f] bg-[#40444b]/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200">{roleConfig.discordId}</span>
                              <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded">Aguardando login</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              roleConfig.role === 'ADMIN' ? 'bg-red-600/20 text-red-400' :
                              roleConfig.role === 'READER' ? 'bg-blue-600/20 text-blue-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {roleConfig.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {new Date(roleConfig.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => setEditingUserRole({ id: roleConfig.id, role: roleConfig.role, type: 'preconfigured' })}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deletePreConfiguredRole(roleConfig.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {users.length === 0 && preConfiguredRoles.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            Nenhum usuário ou role configurada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Questions Tab */}
          {activeTab === "questions" && (
            <div className="space-y-6">
                <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-white">Perguntas do Formulário</h2>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setShowQuestionForm(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      + Nova Pergunta
                    </button>
                  </div>
                  
                  {loadingQuestions ? (
                    <p className="text-center text-gray-300">Carregando...</p>
                  ) : questions.length === 0 ? (
                    <p className="text-center text-gray-300">Nenhuma pergunta cadastrada</p>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div key={question.id} className="bg-[#40444b] border border-gray-600 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-100">
                                {index + 1}. {question.question}
                                {question.required && <span className="text-red-400 ml-1">*</span>}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                Tipo: {question.type}
                              </p>
                              {question.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-300">Opções:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-300">
                                    {question.options.map((opt) => (
                                      <li key={opt.id}>{opt.label}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingQuestion(question);
                                  setShowQuestionForm(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => deleteQuestion(question.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-2"
                                title="Deletar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              
              {/* Question Form Modal */}
              {showQuestionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-[#2f3136] rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-600">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      {editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}
                    </h3>
                    
                    <form onSubmit={handleQuestionSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Pergunta
                        </label>
                        <input
                          type="text"
                          name="question"
                          defaultValue={editingQuestion?.question}
                          required
                          className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Tipo de Resposta
                        </label>
                        <select
                          name="type"
                          defaultValue={editingQuestion?.type || "TEXT"}
                          className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        >
                          <option value="TEXT">Texto Curto</option>
                          <option value="TEXTAREA">Texto Longo</option>
                          <option value="RADIO">Múltipla Escolha (única)</option>
                          <option value="CHECKBOX">Múltipla Escolha (várias)</option>
                          <option value="SELECT">Lista Suspensa</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="required"
                            defaultChecked={editingQuestion?.required ?? true}
                            className="w-4 h-4 text-[#5865F2]"
                          />
                          <span className="text-sm font-medium text-gray-200">Campo obrigatório</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Opções (para múltipla escolha/lista)
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                          Uma opção por linha. Use formato: valor|rótulo ou apenas rótulo
                        </p>
                        <textarea
                          name="options"
                          defaultValue={editingQuestion?.options.map(o => `${o.value}|${o.label}`).join("\n")}
                          rows={5}
                          placeholder="opcao1|Opção 1&#10;opcao2|Opção 2"
                          className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-[#5865F2] text-white px-4 py-2 rounded-lg hover:bg-[#4752C4] transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setEditingQuestion(null);
                          }}
                          className="flex-1 bg-[#40444b] text-gray-200 px-4 py-2 rounded-lg hover:bg-[#4f545c] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Webhooks Tab */}
          {activeTab === "webhooks" && (
            <div className="space-y-6">
              <div className="bg-[#2f3136] rounded-lg border border-gray-600 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-white">Webhooks do Discord</h2>
                  <button
                    onClick={() => {
                      setEditingWebhook(null);
                      setShowWebhookForm(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Novo Webhook
                  </button>
                </div>
                
                <p className="text-gray-300 mb-4 text-sm">
                  Configure webhooks do Discord para receber notificações quando um formulário for enviado.
                </p>
                
                {loadingWebhooks ? (
                  <p className="text-center text-gray-300">Carregando...</p>
                ) : webhooks.length === 0 ? (
                  <p className="text-center text-gray-300">Nenhum webhook cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="bg-[#40444b] border border-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-100">{webhook.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded ${webhook.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                {webhook.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 break-all">{webhook.url}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Criado em: {new Date(webhook.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => toggleWebhook(webhook.id, !webhook.isActive)}
                              className={`px-3 py-1 rounded text-sm ${webhook.isActive ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                              {webhook.isActive ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingWebhook(webhook);
                                setShowWebhookForm(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteWebhook(webhook.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-2"
                              title="Deletar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Webhook Form Modal */}
              {showWebhookForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-[#2f3136] rounded-lg shadow-xl p-6 max-w-2xl w-full border border-gray-600">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
                    </h3>
                    
                    <form onSubmit={handleWebhookSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          Nome do Webhook
                        </label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={editingWebhook?.name}
                          required
                          placeholder="Ex: Canal de Formulários"
                          className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                          URL do Webhook
                        </label>
                        <input
                          type="url"
                          name="url"
                          defaultValue={editingWebhook?.url}
                          required
                          placeholder="https://discord.com/api/webhooks/..."
                          className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Obtenha a URL do webhook nas configurações do canal do Discord
                        </p>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-[#5865F2] text-white px-4 py-2 rounded-lg hover:bg-[#4752C4] transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowWebhookForm(false);
                            setEditingWebhook(null);
                          }}
                          className="flex-1 bg-[#40444b] text-gray-200 px-4 py-2 rounded-lg hover:bg-[#4f545c] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Modal de Adicionar Usuário */}
          {showUserForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2f3136] rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-600">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Adicionar Usuário
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Discord ID
                    </label>
                    <input
                      type="text"
                      value={newUserData.discordId}
                      onChange={(e) => setNewUserData({ ...newUserData, discordId: e.target.value })}
                      required
                      placeholder="Ex: 180722594587082753"
                      className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      O Discord ID do usuário que você deseja configurar
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Role
                    </label>
                    <select
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as Role })}
                      className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                    >
                      <option value="USER">USER</option>
                      <option value="READER">READER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Se o usuário já estiver cadastrado, a role será atualizada. Caso contrário, será aplicada no primeiro login.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleAddUser}
                      className="flex-1 bg-[#5865F2] text-white px-4 py-2 rounded-lg hover:bg-[#4752C4] transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setShowUserForm(false);
                        setNewUserData({ discordId: '', role: 'USER' });
                      }}
                      className="flex-1 bg-[#40444b] text-gray-200 px-4 py-2 rounded-lg hover:bg-[#4f545c] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal de Editar Role */}
          {editingUserRole && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2f3136] rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-600">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Editar Permissão
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Role
                    </label>
                    <select
                      value={editingUserRole.role}
                      onChange={(e) => setEditingUserRole({ ...editingUserRole, role: e.target.value as Role })}
                      className="w-full px-4 py-2 bg-[#40444b] text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                    >
                      <option value="USER">USER</option>
                      <option value="READER">READER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleEditRole}
                      className="flex-1 bg-[#5865F2] text-white px-4 py-2 rounded-lg hover:bg-[#4752C4] transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingUserRole(null)}
                      className="flex-1 bg-[#40444b] text-gray-200 px-4 py-2 rounded-lg hover:bg-[#4f545c] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
