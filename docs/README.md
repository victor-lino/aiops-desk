# Technical Decisions

[🇧🇷 Ler em português](README-pt-br.md)

A record of the non-obvious calls made while building AIOps Desk, and why.

## Webhook + polling, not just webhook

Zabbix pushes alerts to `POST /webhooks/zabbix` in real time, which covers
the common case. But a webhook call can be missed (network blip, backend
restart at the wrong moment), and a missed alert becoming a missed ticket
isn't acceptable for an ops tool. A background poller checks Zabbix every
60 seconds as a safety net, using `zabbix_eventid` to avoid creating a
second ticket for a problem the webhook already handled. The two
mechanisms are redundant on purpose.

## One `tickets` table with an `origem` field, not separate tables

Tickets can come from three places: a Zabbix webhook, the poller, or a
human (an analyst via `/diagnostico`, or an end user via the public "open a
ticket" form). Rather than modeling each source as its own table, all of
them write into a single `tickets` table with an `origem` field
(`zabbix`, `manual`, etc.). This keeps the dashboard, SLA logic, and
AI-suggestion pipeline source-agnostic — they work the same way regardless
of where the ticket came from, and adding a new source later doesn't
require touching every downstream feature.

## Retiring `Chamados`/`Histórico` in favor of `Tickets`

The project originally had a separate `Chamados`/`Histórico` flow, fed only
by `/diagnostico` and `/zabbix/diagnosticar/{eventid}`. It had no status,
priority, or resolution tracking — unlike `Tickets`, which did. Once
`Tickets` covered everything `Chamados` did and more, keeping both was
just duplicated state with no clear ownership of which one was "current."
`Tickets` became the single source of truth, and `Chamados`/`Histórico`
was retired.

## Diagnóstico screen doesn't create a ticket

Early on, the `/diagnostico` flow both generated an AI diagnostic *and*
persisted a ticket. That conflated two different intents: "help me
understand what's going on" vs. "open something that needs to be tracked
and resolved." Diagnóstico now only produces a suggestion — it never
writes to `Tickets`. Opening a ticket is exclusively the job of the
"Abrir ticket" flow (public form or explicit analyst action).

## `HTTPBearer` over `OAuth2PasswordBearer`

The backend originally had both — `HTTPBearer` in `main.py`,
`OAuth2PasswordBearer` in `tickets.py` — which caused inconsistent 401/422
behavior in Swagger depending on which router handled a request (see
[troubleshooting/04](../troubleshooting/04-conflicting-auth-schemes.md)).
`OAuth2PasswordBearer` is built around the OAuth2 password-grant flow,
which doesn't map cleanly onto "log in against AD, then use a bearer
token" — so the app standardized on plain `HTTPBearer` everywhere.

## Credentials in the request body, not query parameters

`/login` originally accepted username/password as query parameters, which
meant they could end up in access logs by default. Moved to a JSON request
body instead — see
[troubleshooting/06](../troubleshooting/06-credentials-leaking-into-logs.md).

## GPO-level fix for LDAP signing, not a local registry tweak

`LDAPServerIntegrity` was originally set locally, but Group Policy kept
overwriting it back on every refresh cycle. The fix had to happen at the
GPO level (Default Domain Controllers Policy) to actually stick — see
[troubleshooting/05](../troubleshooting/05-ldap-signing-required.md).
