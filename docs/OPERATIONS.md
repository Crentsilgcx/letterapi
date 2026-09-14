# Production Operations

## Recommended topology

Internet/LAN client → HTTPS reverse proxy/load balancer → Letter Receipt app → private MySQL 8.4

Do not expose MySQL publicly. Restrict `/reception` and `/admin` to the organizational network/VPN if the deployment model permits it.

## Secrets

Use a secret manager or protected environment configuration for database passwords and the bootstrap admin password. Never commit `.env`.

## First deployment

1. Copy `.env.example` to `.env` and replace all sample secrets.
2. Set the organization name and timezone.
3. Run `docker compose up -d --build`.
4. Confirm `GET /actuator/health` returns `UP`.
5. Log in as bootstrap admin.
6. Configure recipients and receptionist users.
7. Complete delivery → receipt UAT before making the kiosk available.

## Backups

Back up MySQL daily at minimum. Retain multiple restore points and perform periodic restore tests. A backup that has never been restored should not be considered verified.

Example:

```bash
docker compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE" > backup-$(date +%F).sql
```

## Monitoring

Monitor:

- `/actuator/health`
- container/process uptime
- disk utilization
- MySQL storage growth
- HTTP 5xx rate
- reverse-proxy TLS certificate expiry
- database backup success

## Upgrade procedure

1. Take/verify a database backup.
2. Test the new build against a copy of production data where possible.
3. Deploy the application image.
4. Flyway applies forward-only schema migrations on startup.
5. Verify health, login, delivery creation, receipt confirmation and tracking.
6. Do not manually edit Flyway history rows.

## Security controls included

- BCrypt password hashing (cost 12)
- Spring Security role authorization
- CSRF protection on authenticated state-changing browser operations
- session invalidation on logout
- HttpOnly session cookie; `Secure` cookies when `SPRING_PROFILES_ACTIVE=prod` or `SESSION_COOKIE_SECURE=true`
- MySQL TLS required in the `prod` profile (`useSSL=true&requireSSL=true`)
- Rate limits on `POST /login` and `POST /api/public/deliveries`
- Random, non-enumerable tracking tokens assigned in the creating insert
- Public kiosk does not expose courier phone or email
- Startup fails if the first admin cannot be bootstrapped
- Concurrent receipt updates return HTTP 409 (`OptimisticLockingFailureException`)
- server-generated workflow timestamps
- authenticated `receivedBy`
- immutable delivery event history
- optimistic locking on letter records
- reduced public tracking response
- last-active-admin disable protection

## Reverse proxy

See `deploy/nginx.conf.example`. Configure a real hostname/certificate and ensure the proxy overwrites rather than appends untrusted forwarding headers at the network edge.

For HTTPS production, set `SPRING_PROFILES_ACTIVE=prod` (or `SESSION_COOKIE_SECURE=true` plus a TLS-capable MySQL URL). Local Docker Compose stays on HTTP and does not require database TLS.
