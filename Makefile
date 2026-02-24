.PHONY: setup start stop backend frontend db seed

setup:
	@echo "🚀 Setting up KairoHR..."
	cd ai-hr-backend && pnpm install
	cd ai-hr-frontend && npm install
	@echo "✅ Dependencies installed"

docker-up:
	cd ai-hr-backend && docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 5
	@echo "✅ Docker services started"

db-migrate:
	cd ai-hr-backend && npx prisma migrate dev --name init

db-seed:
	cd ai-hr-backend && pnpm db:seed

db-setup: docker-up db-migrate db-seed
	@echo "✅ Database ready with seed data"

backend:
	cd ai-hr-backend && pnpm dev

frontend:
	cd ai-hr-frontend && npm run dev

start:
	@echo "Starting backend on :3000 and frontend on :5173"
	@(cd ai-hr-backend && pnpm dev) & (cd ai-hr-frontend && npm run dev)

stop:
	cd ai-hr-backend && docker compose down

status:
	cd ai-hr-backend && docker compose ps
