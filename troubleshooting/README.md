# Troubleshooting Log

Real bugs found and fixed while building AIOps Desk — kept here as a record
of the debugging process, not just the final result.

| # | Issue | Area |
|---|-------|------|
| [01](01-timezone-naive-vs-aware.md) | Wrong ticket timestamps (naive vs. aware datetimes) | Backend / models |
| [02](02-duplicate-tickets-from-poller.md) | Poller could create duplicate tickets for the same Zabbix problem | Backend / poller |
| [03](03-uuid-vs-integer-id-mismatch.md) | Type error inserting into `chamados` (integer id vs UUID) | Database |
| [04](04-conflicting-auth-schemes.md) | 401 / 422 errors from two conflicting auth schemes | Backend / auth |
| [05](05-ldap-signing-required.md) | LDAP login failing with `strongerAuthRequired` | Active Directory |
| [06](06-credentials-leaking-into-logs.md) | Login credentials exposed via query parameters | Security |
| [07](07-email-links-timeout-base-url.md) | Ticket email resolution links timing out | Networking / email |
| [08](08-wrong-ad-server-ip-in-env.md) | LDAP calls failing due to a typo'd IP in `.env` | Configuration |
| [09](09-port-conflict-docker-and-local.md) | Port conflicts running Docker Compose and local dev together | DevOps |
| [10](10-missing-dotenv-and-lost-model.md) | Server failing to boot: missing `load_dotenv()` + lost model class | Backend |
| [11](11-zabbix-empty-host-list-permissions.md) | Zabbix `host.get` returning an empty host list | Zabbix / permissions |
