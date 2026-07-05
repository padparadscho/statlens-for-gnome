.PHONY: lint lint-fix format format-fix compile install

lint:
	pnpm lint

lint-fix:
	pnpm lint --fix

format:
	pnpm format

format-fix:
	pnpm format --fix

compile:
	./scripts/compile.sh

install:
	./scripts/install.sh
