# Bug: Type error inserting into `chamados` table (integer id vs UUID)

## Symptom
`POST /diagnostico` was failing with a database type error when trying to
insert a new row into the `chamados` table.

## Root Cause
The `chamados` table in Postgres still had its `id` column as `integer`,
left over from an older version of the schema. The current SQLAlchemy model
generates a UUID for `id`, so every insert failed at the type level.

## Fix
Dropped the outdated table directly in the Postgres container
(`docker exec` into `aiops-desk-db-1`) and let
`Base.metadata.create_all()` recreate it from the current model definition,
this time with `id` as UUID. Re-tested `POST /diagnostico` and confirmed a
`200 OK`.

## Lesson
`Base.metadata.create_all()` only creates tables that don't exist yet — it
never migrates an existing table's columns. Any schema change to an
existing model needs either a real migration tool (Alembic) or, in a local
dev database with disposable data, a manual drop-and-recreate.
