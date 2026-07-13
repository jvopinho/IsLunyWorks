#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# 1. Validate mandatory environment variables
echo "Validating environment variables..."
MISSING_VAR=0

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: A variável de ambiente DATABASE_URL está ausente."
  MISSING_VAR=1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ ERROR: A variável de ambiente NEXTAUTH_SECRET está ausente."
  MISSING_VAR=1
fi

if [ -z "$NEXTAUTH_URL" ]; then
  echo "❌ ERROR: A variável de ambiente NEXTAUTH_URL está ausente."
  MISSING_VAR=1
fi

if [ "$MISSING_VAR" -eq 1 ]; then
  echo "❌ Falha na inicialização: Configure as variáveis obrigatórias no ambiente do container."
  exit 1
fi

echo "✅ Validação concluída com sucesso."

# 2. Run database migrations with error handling
echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "❌ ERROR: Falha ao executar as migrations do Prisma. Verifique a conexão com o banco de dados em DATABASE_URL."
  exit 1
fi

# 3. Run database seed with error handling
echo "Seeding the database..."
if ! npx prisma db seed; then
  echo "❌ ERROR: Falha ao rodar as seeds do banco de dados."
  exit 1
fi

# 4. Start the Next.js standalone application
echo "Starting the Next.js application..."
exec node server.js
