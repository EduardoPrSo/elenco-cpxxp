// Tipos do Prisma definidos manualmente para evitar problemas de build
// Sincronizar com prisma/schema.prisma
// Estes são compatíveis com os valores do banco de dados

export type Role = "USER" | "READER" | "ADMIN";
export type QuestionType = "TEXT" | "TEXTAREA" | "RADIO" | "CHECKBOX" | "SELECT";

// Constantes para uso no código
export const Role = {
  USER: "USER" as Role,
  READER: "READER" as Role,
  ADMIN: "ADMIN" as Role,
} as const;

export const QuestionType = {
  TEXT: "TEXT" as QuestionType,
  TEXTAREA: "TEXTAREA" as QuestionType,
  RADIO: "RADIO" as QuestionType,
  CHECKBOX: "CHECKBOX" as QuestionType,
  SELECT: "SELECT" as QuestionType,
} as const;
