# Monitoring Integration

[🇧🇷 Ler em português](README-pt-br.md)

How AIOps Desk integrates with Zabbix.

## Endpoints

- `GET /zabbix/problemas` — lists current active problems from Zabbix.
- `POST /zabbix/diagnosticar/{eventid}` — runs the AI diagnostic
  (`diagnosticar()`) against a specific Zabbix problem and stores the
  result.
- `POST /webhooks/zabbix` — receives a real-time alert push from Zabbix
  and creates a ticket. Authenticated via an `x-webhook-secret` header
  whose value is a shared secret configured in both Zabbix's webhook
  media type and the backend's environment — never committed to the
  repo (see `.env.example`).

## How a Zabbix problem becomes a ticket

Two independent mechanisms feed the same `tickets` table:

1. **Webhook** — Zabbix's media type calls `POST /webhooks/zabbix` the
   moment a problem fires. Fastest path, but depends on Zabbix
   successfully reaching the backend at that instant.
2. **Poller** — a background task (`asyncio.create_task`, started on
   FastAPI startup) queries `host.get` / `problem.get` against the
   Zabbix API every 60 seconds and creates a ticket for any active
   problem that doesn't already have one, matched by `zabbix_eventid`.
   This exists purely as a safety net for missed webhook calls.

## Severity → priority mapping

Zabbix problem severity is mapped to the ticket's `prioridade` field when
a ticket is created from a Zabbix event, so operators see a consistent
priority scale regardless of whether a ticket came from Zabbix or from a
human. The AI (`sugerir_resolucao()`) can also suggest a priority based on
the problem description, which is stored alongside — not instead of —
the Zabbix-derived value.

## Required Zabbix-side configuration

- A Zabbix API user (referred to here as the "aiops-api" user) with read
  permission over the host groups you want AIOps Desk to see. Without
  this, `host.get` / `problem.get` return empty results even when hosts
  and problems exist — see
  [troubleshooting/11](../troubleshooting/11-zabbix-empty-host-list-permissions.md).
- A webhook media type pointing at your backend's
  `/webhooks/zabbix` endpoint, sending the shared secret in the
  `x-webhook-secret` header.

## Configuration

All Zabbix connection details (API URL, credentials, webhook secret) are
read from environment variables — see `.env.example` in the project root
for the full list of keys. None of these values are committed to the
repository.
