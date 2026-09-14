# Bug: 401 / Unprocessable Entity on ticket endpoints in Swagger

## Symptom
Calling ticket endpoints through Swagger UI intermittently returned either
`401 Unauthorized` or `422 Unprocessable Entity`, even with a seemingly
valid token.

## Root Cause
`auth_service.py` had two different authentication schemes declared across
the codebase: `HTTPBearer` in `main.py` and `OAuth2PasswordBearer` in
`tickets.py`. Swagger's UI and FastAPI's dependency injection handled the
two schemes differently, so depending on which router handled the request,
the token was validated (or expected) in a different way.

## Fix
Unified authentication into a single `HTTPBearer` scheme inside
`auth_service.py`. `obter_usuario_atual()` now consistently receives an
`HTTPAuthorizationCredentials` object regardless of which router calls it.
Re-tested `GET /tickets` and confirmed it correctly returned the ticket
created earlier by the Zabbix webhook, including its AI-generated
`sugestao_ia` and `prioridade_ia` fields.

## Lesson
Mixing two auth dependency schemes across routers in the same FastAPI app
is an easy way to get inconsistent behavior that looks like a token
problem but is actually a wiring problem. Pick one scheme and use it
everywhere `Depends()` needs the current user.
