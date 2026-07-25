# poof

Anonymous one-time text links. Create a poof, send the link, and the content disappears after it is
viewed.

Poof is free, open-source, and intentionally simple: no accounts, no orgs, no dashboards, no
tracking.

## Features

- One-time view: encrypted entries are deleted when retrieved
- Client-side encryption: text is encrypted in the browser and the key never reaches the server
- Anonymous: no auth or user records
- Expiring entries: unopened poofs expire after a configurable TTL

## Tech Stack

- TanStack Start & React
- Tailwind CSS
- Redis
- AES-256-GCM via the Web Crypto API

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
REDIS_URL=redis://localhost:6379
POOF_DEFAULT_TTL_SECONDS=604800
```

Web Crypto requires a secure browser context. Use HTTPS outside local development.

## Docker

The official image is published to `ghcr.io/novmbrs/poof`.

Copy the example environment file and start the stack:

```bash
cp .env.example .env
docker compose up -d
```

Poof is available at `http://localhost:3000`. Set `POOF_PORT` in `.env` to use a different host
port. Redis data is stored in the `poof_redis-data` Docker volume.

To upgrade or stop the stack:

```bash
docker compose pull
docker compose up -d
docker compose down
```

To run only the application image against an existing Redis server:

```bash
docker run --rm -p 3000:3000 \
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
- `POST /text` accepts `{ "payload": { "version": 1, "iv": "...", "ciphertext": "..." }, "ttl": 3600 }` and returns `{ "id": "..." }`.
- `GET /text/:id` returns the encrypted payload and deletes the poof. API clients are responsible
  for encryption, key sharing, and decryption.

Web share links keep the random 256-bit encryption key in the URL fragment (`#key=...`). Browsers do
not send that fragment to the server.

## Verification

```bash
bun run test
bun run lint
bun run build
```

## License

[MIT](./LICENSE)
