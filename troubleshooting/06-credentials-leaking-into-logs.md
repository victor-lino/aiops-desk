# Fix: Login credentials were exposed via query parameters

## Symptom
The `/login` endpoint originally accepted username and password as query
parameters.

## Root Cause
Query parameters are logged by default by most web servers and reverse
proxies (access logs, request tracing, browser history), which means
plaintext passwords could end up persisted in server logs just from normal
request handling — a real security concern even in a local/dev
environment.

## Fix
Changed `/login` to receive credentials in the JSON request body instead of
as query parameters, so they never appear in URLs or default access logs.

## Lesson
Credentials (and any other secret) should never travel in a URL — not for
convenience, not even temporarily during development — because logging
infrastructure is usually configured to capture the URL by default and
rarely by design excludes query strings from that capture.
