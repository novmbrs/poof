# poof

Anonymous one-time text links. Create a poof, send the link, and the content disappears after it is
viewed.

Poof is free, open-source, and intentionally simple: no accounts, no orgs, no dashboards, no
tracking.

## Features

- One-time view: entries are deleted after a successful read
- Encrypted storage: text is encrypted before being stored in Redis
- Anonymous: no auth or user records
- Expiring entries: unopened poofs expire after a configurable TTL

## Tech Stack

- TanStack Start & React
- Tailwind CSS
- Redis
- AES-256-GCM via Node crypto

## Development

Start Redis:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Set up the app:

```bash
cp .env.example .env
bun install
bun run dev
```

Required environment:

```bash
ENCRYPTION_KEY=replace-with-a-long-random-secret
REDIS_URL=redis://localhost:6379
POOF_DEFAULT_TTL_SECONDS=604800
```

## Docker

The official image is published to `ghcr.io/novmbrs/poof`.

Copy the example environment file and replace the encryption key with a stable random secret:

```bash
cp .env.example .env
openssl rand -hex 32
# Put the generated value in .env as ENCRYPTION_KEY, then start the stack.
docker compose up -d
```

Poof is available at `http://localhost:3000`. Set `POOF_PORT` in `.env` to use a different host
port. Redis data is stored in the `poof_redis-data` Docker volume.

The encryption key must remain the same between restarts and upgrades. Existing poofs cannot be
decrypted if the key changes.

To upgrade or stop the stack:

```bash
docker compose pull
docker compose up -d
docker compose down
```

To run only the application image against an existing Redis server:

```bash
docker run --rm -p 3000:3000 \
  -e ENCRYPTION_KEY=replace-with-a-long-random-secret \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e POOF_DEFAULT_TTL_SECONDS=604800 \
  ghcr.io/novmbrs/poof:latest
```

On Linux, use a Redis address reachable from the container instead of `host.docker.internal`, or add
`--add-host=host.docker.internal:host-gateway`.

## Routes

- `GET /` opens the simple home page.
- `GET /new` creates a new poof.
- `GET /p/:id` reveals and deletes a poof.
- `GET /health` returns service status.
- `POST /text` accepts `{ "text": "secret", "ttl": 3600 }` and returns `{ "id": "..." }`.
- `GET /text/:id` reveals and deletes a poof through the compatibility API.

## Verification

```bash
bun run test
bun run lint
bun run build
```

## License

[MIT](./LICENSE)
