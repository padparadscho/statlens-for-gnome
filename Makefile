.PHONY: install lint lint-fix format format-fix

install:
	pnpm install

lint:
	pnpm lint

lint-fix:
	pnpm lint --fix

format:
	pnpm format

format-fix:
	pnpm format --fix
