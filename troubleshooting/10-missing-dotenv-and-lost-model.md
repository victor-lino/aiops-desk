# Bug: Environment variables not loading + a model class silently disappeared

## Symptom
After adding the ticket system (`tickets.py` for CRUD/AI-priority/
token-based resolution, and `webhooks.py` for receiving Zabbix alerts), the
server failed to start cleanly. Separately, code referencing the `Chamado`
model started throwing errors, as if the class no longer existed.

## Root Cause
Two independent issues compounded:
1. `main.py` was missing `load_dotenv()`, so environment variables from
   `.env` (including the database connection string) weren't being loaded
   at all.
2. The `Chamado` class had gone missing from `models.py` — most likely from
   an earlier edit that overwrote the file instead of extending it.

## Fix
- Added `load_dotenv()` to `main.py`.
- Rebuilt the `Chamado` class in `models.py` alongside `Ticket`.
- Also fixed a related dependency gap: `email-validator` was required by a
  Pydantic email field but wasn't installed.
- After these three fixes, the server started cleanly with every router
  (`diagnostico`, `chamados`, `zabbix`, `tickets`, `webhooks`) visible and
  working in Swagger.

## Lesson
When several independent-looking errors appear at once after a batch of
changes, it's worth checking each file that was touched against what it's
supposed to contain, rather than assuming a single root cause — here it
took fixing three unrelated things (env loading, a missing model class, a
missing dependency) before the server would boot at all.
