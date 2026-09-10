# Bug: Poller could create duplicate tickets for the same Zabbix problem

## Symptom
`poller.py` polls Zabbix every 60 seconds (via `asyncio.create_task` on
FastAPI startup) looking for new problems and opening a ticket for each one.
Without a way to recognize "I already opened a ticket for this", the same
Zabbix problem could end up generating more than one ticket across polling
cycles.

## Root Cause
There was no link between a Zabbix problem and the ticket it generated, so
every poll cycle had no way to tell a genuinely new problem apart from one
it had already handled.

## Fix
Added a `zabbix_eventid` field to the `Ticket` model. Before creating a
ticket for a problem returned by Zabbix, the poller checks whether a ticket
with that `zabbix_eventid` already exists; if so, it skips it. Tested by
running the poller across multiple cycles against the same active problem
and confirming only one ticket was created.

## Lesson
Any recurring job that turns external events into internal records needs an
idempotency key from day one — polling intervals will always overlap with
an event's lifetime at some point.
