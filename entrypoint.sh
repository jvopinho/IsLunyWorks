#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# 1. Load environment variables from .env file if it exists
# if [ -f .env ]; then
#   echo "Loading environment variables from .env file..."
#   # Export non-comment lines
#   export $(grep -v '^#' .env | xargs)
# fi

# 2. Validate mandatory environment variables
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
  echo "❌ Falha na inicialização: Configure as variáveis obrigatórias no arquivo .env ou no ambiente do container."
  exit 1
fi

echo "✅ Validação concluída com sucesso."
echo "DATABASE_URL: $DATABASE_URL"

# 3. Run database migrations with error handling
echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "❌ ERROR: Falha ao executar as migrations do Prisma. Verifique a conexão com o banco de dados em DATABASE_URL."
  exit 1
fi

# 4. Run database seed with error handling
echo "Seeding the database..."
if ! npx prisma db seed; then
  echo "❌ ERROR: Falha ao rodar as seeds do banco de dados."
  exit 1
fi

# 5. Start the Next.js standalone application
echo "Starting the Next.js application..."
if [ -f .env ]; then
  echo "Running node with native --env-file=.env flag..."
  exec node --env-file=.env server.js
else
  echo "Running node using process environment variables..."
  exec node server.js
fi
