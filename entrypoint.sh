#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding the database..."
npx prisma db seed

echo "Starting the Next.js application..."
exec node server.js
