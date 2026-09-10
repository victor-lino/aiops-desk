# Bug: LDAP calls failing due to a typo'd IP in `.env`

## Symptom
LDAP-dependent requests were failing intermittently in a way that looked
like a connectivity issue, even though the domain controller itself was up.

## Root Cause
`AD_SERVER` in the backend `.env` was set to `192.168.244.127`, a
one-digit typo of the actual domain controller address,
`192.168.244.129`.

## Fix
Corrected `AD_SERVER` to `192.168.244.129` in `.env`.

## Lesson
A single wrong digit in an IP is one of the hardest bugs to spot by reading
code, because the code itself is completely correct — the error only shows
up as a networking symptom. Worth verifying infrastructure IPs against
their actual source (the VM/host config) rather than against memory when
debugging connectivity issues.
