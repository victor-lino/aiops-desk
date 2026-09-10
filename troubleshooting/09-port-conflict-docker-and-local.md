# Bug: Port conflicts running Docker Compose and local dev servers together

## Symptom
Backend and frontend behaved inconsistently — sometimes hitting the wrong
version of the code, and the frontend fell back to port `5174` instead of
its usual `5173`.

## Root Cause
The environment had both `docker compose` (running
`aiops-desk-backend-1`, `aiops-desk-frontend-1`, `aiops-desk-db-1`) and the
local `uvicorn` / `npm run dev` processes running at the same time,
competing for ports `8000` (backend) and `5173` (frontend).

## Fix
Identified the conflict and standardized on running one mode at a time
during active development — local `uvicorn` + `npm run dev` for fast
iteration, Docker Compose for integration testing — rather than both
simultaneously.

## Lesson
Docker Compose services and their local equivalents will silently fight
over the same ports if both are started; a stray "leave it running in the
background" habit from an earlier session is an easy way to lose time
debugging something that isn't actually a code bug.
