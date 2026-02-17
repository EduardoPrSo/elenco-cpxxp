import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar perguntas existentes
  await prisma.formQuestion.deleteMany();
  console.log('✅ Perguntas antigas removidas');

  // Criar perguntas de exemplo
  const questions = [
    {
      question: 'Qual é o seu nome completo?',
      type: 'TEXT' as const,
      required: true,
      order: 1,
    },
    {
      question: 'Conte um pouco sobre você',
      type: 'TEXTAREA' as const,
      required: true,
      order: 2,
    },
    {
      question: 'Qual é a sua área de interesse?',
      type: 'RADIO' as const,
      required: true,
      order: 3,
      options: {
        create: [
          { value: 'tech', label: 'Tecnologia' },
          { value: 'design', label: 'Design' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'other', label: 'Outro' },
        ],
      },
    },
    {
      question: 'Quais linguagens de programação você conhece?',
      type: 'CHECKBOX' as const,
      required: false,
      order: 4,
      options: {
        create: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
          { value: 'csharp', label: 'C#' },
          { value: 'other', label: 'Outra' },
        ],
      },
    },
    {
      question: 'Qual é o seu nível de experiência?',
      type: 'SELECT' as const,
      required: true,
      order: 5,
      options: {
        create: [
          { value: 'beginner', label: 'Iniciante' },
          { value: 'intermediate', label: 'Intermediário' },
          { value: 'advanced', label: 'Avançado' },
          { value: 'expert', label: 'Expert' },
        ],
      },
    },
  ];

  for (const question of questions) {
    await prisma.formQuestion.create({
      data: question,
    });
  }

  console.log('✅ Perguntas de exemplo criadas');
  console.log(`📝 Total: ${questions.length} perguntas`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
