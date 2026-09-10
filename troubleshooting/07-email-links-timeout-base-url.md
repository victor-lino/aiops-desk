# Bug: Resolution links in ticket emails timed out

## Symptom
The ticket-suggestion email (sent via Gmail SMTP) included action links
(`resolvido` / `nao_resolvido`) built from `BASE_URL`. Clicking them timed
out instead of loading the resolution page.

## Root Cause
`BASE_URL` was set to the Zabbix server's internal address
(`192.168.244.128`), which is only reachable from inside the lab's internal
network — not from wherever the email link was actually being opened.

## Fix
Temporarily switched `BASE_URL` to `http://127.0.0.1:8000` for local
development, since the backend was still running only locally at that
stage. Documented that the permanent fix is to host the backend on the same
network segment as Zabbix (`192.168.244.128`) once the project moves to
production, so `BASE_URL` in `.env` can point there and the email links
resolve correctly from any client that can reach that network.

## Lesson
A value like `BASE_URL` that gets embedded into outbound content (emails,
webhooks, shareable links) needs to be reachable from the *recipient's*
network, not just from the server generating it — worth treating
separately from purely internal service-to-service URLs.
