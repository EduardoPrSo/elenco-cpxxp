"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  if (!session) return null;
  
  const isAdmin = session.user.role === "ADMIN";
  const isReaderOrAdmin = session.user.role === "READER" || session.user.role === "ADMIN";
  
  // Verifica se está em alguma página que não seja a home/formulário
  const isInSecondaryPage = pathname === "/admin" || pathname === "/respostas";
  
  return (
    <div className="px-4 pt-4 flex justify-center">
      <nav className="bg-[#36393f] shadow-lg rounded-md w-3/4">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Image src="/logo.png" alt="Projetos CPX XP" width={150} height={40} className="object-contain" />
              
              {isInSecondaryPage ? (
                <Link 
                  href="/" 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Voltar
                </Link>
              ) : (
                <div className="flex gap-3">
                  {isReaderOrAdmin && (
                    <Link 
                      href="/respostas" 
                      className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
                    >
                      Respostas
                    </Link>
                  )}
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="font-semibold text-white">{session.user.name}</p>
                  <p className="text-xs text-gray-400">{session.user.role}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
