REGISTRY := registry.k8s.ojdip.net
BACKEND_IMAGE := $(REGISTRY)/potluck-backend:latest
FRONTEND_IMAGE := $(REGISTRY)/potluck-frontend:latest
NAMESPACE := potluck

.PHONY: build push secrets deploy rollout all lint format

build:
	docker build -t $(BACKEND_IMAGE) ./backend
	docker build -t $(FRONTEND_IMAGE) ./frontend

push: build
	docker push $(BACKEND_IMAGE)
	docker push $(FRONTEND_IMAGE)

secrets:
	kubectl create secret generic backend-secret \
		--namespace=$(NAMESPACE) \
		--from-literal=APP_PASSWORD="$$APP_PASSWORD" \
		--from-literal=SECRET_KEY="$$SECRET_KEY" \
		--from-literal=POTLUCK_ANTHROPIC_API_KEY="$$POTLUCK_ANTHROPIC_API_KEY" \
		--dry-run=client -o yaml | kubectl apply -f -

deploy:
	kubectl apply -f k8s/

rollout:
	kubectl rollout restart deployment/backend --namespace=$(NAMESPACE)
	kubectl rollout restart deployment/frontend --namespace=$(NAMESPACE)

all: push secrets deploy rollout

lint:
	cd backend && uv run ruff check .
	cd backend && uv run ruff format --check .
	cd frontend && yarn lint
	cd frontend && yarn format:check

format:
	cd backend && uv run ruff check --fix .
	cd backend && uv run ruff format .
	cd frontend && yarn format
