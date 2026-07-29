.PHONY: check lint format compile install

check:
	pnpm check

lint:
	pnpm lint

format:
	pnpm format

compile:
	./scripts/compile.sh

install:
	./scripts/install.sh
