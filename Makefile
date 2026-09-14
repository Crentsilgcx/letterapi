.PHONY: test package verify up down logs smoke scan

test:
	mvn clean test

verify:
	mvn clean verify

package:
	mvn clean package

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f app

smoke:
	./scripts/smoke-test.sh

scan:
	mvn -Ddependency-check.skip=false org.owasp:dependency-check-maven:check
