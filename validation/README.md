# Validation

[🇧🇷 Ler em português](README-pt-br.md)

Evidence that the main flows work end to end, gathered during development.
No hostnames, IPs, or credentials from the lab are reproduced here — each
item describes the check performed and its result, not the environment
details.

## LDAP login

- **Check**: log in through the frontend's Login screen using a domain
  account's real credentials.
- **Result**: backend successfully binds against the domain controller
  over LDAP, issues a session token, and the frontend lands on Visão
  Geral with the analyst's name shown. Confirmed working after resolving
  the LDAP signing requirement (see
  [troubleshooting/05](../troubleshooting/05-ldap-signing-required.md)).

## Public "open a ticket" flow

- **Check**: submit the public ticket form without being logged in.
- **Result**: a new ticket is created with `origem = manual`, visible to
  analysts in the Tickets screen, without requiring the end user to
  authenticate.

## Zabbix webhook → ticket

- **Check**: send a simulated Zabbix alert to `POST /webhooks/zabbix`
  (authenticated with the shared secret) using a REST client.
- **Result**: a ticket is created automatically with `origem = zabbix`,
  `zabbix_eventid` populated, and `sugestao_ia` / `prioridade_ia` filled
  in by the AI.

## Poller safety net

- **Check**: let the poller run across multiple 60-second cycles against
  the same active Zabbix problem, without a webhook call.
- **Result**: exactly one ticket is created for the problem — no
  duplicates across cycles, confirming the `zabbix_eventid` dedupe logic
  works (see
  [troubleshooting/02](../troubleshooting/02-duplicate-tickets-from-poller.md)).

## Ticket email + resolution links

- **Check**: trigger a ticket-suggestion email and click the
  `resolvido` / `nao_resolvido` links.
- **Result**: styled HTML email delivered via SMTP, and both resolution
  links load a styled confirmation page and correctly update the ticket's
  status.

## SLA highlighting

- **Check**: leave a critical, unassigned ticket open past the 30-minute
  threshold.
- **Result**: the ticket receives an "SLA ESTOURADO" badge and a pulsing
  red-tinted card background, recalculated every minute.

## Auth unification

- **Check**: call `GET /tickets` after unifying on a single `HTTPBearer`
  scheme.
- **Result**: consistently returns `200 OK` with the expected ticket
  data, including AI-generated fields — no more intermittent 401/422
  (see
  [troubleshooting/04](../troubleshooting/04-conflicting-auth-schemes.md)).
