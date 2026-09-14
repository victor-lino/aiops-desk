# Bug: Wrong timestamps on tickets (naive vs. aware datetimes)

## Symptom
Tickets were being created and updated with timestamps that didn't match the
actual local time — `criado_em` / `atualizado_em` were consistently off.

## Root Cause
`models.py` had reverted to using `datetime.utcnow()` for the `Ticket` and
`Chamado` timestamp fields — most likely from an earlier edit that wasn't
saved, or that got overwritten during later changes. `datetime.utcnow()`
returns a naive UTC datetime, which was then displayed as if it were local
time, producing the offset.

## Fix
Replaced `datetime.utcnow()` with `datetime.now()` in:
- `Ticket.criado_em`
- `Ticket.atualizado_em`
- `Chamado.criado_em`

## Lesson
Naive datetimes are a silent trap: the code runs fine, the value looks like
a valid timestamp, and the bug only shows up when a human compares it
against the clock on the wall. Worth double-checking every `datetime.utcnow`
vs `datetime.now` choice against how the value will actually be displayed
downstream, especially after refactors that touch model fields.
