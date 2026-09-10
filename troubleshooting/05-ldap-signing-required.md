# Bug: LDAP login failing with `strongerAuthRequired`

## Symptom
The `/login` endpoint, authenticating against Active Directory over LDAP,
was failing with a `strongerAuthRequired` error before it even got to
checking credentials.

## Root Cause
The domain controller (Windows Server Core, no GUI) required LDAP signing,
and the local registry setting (`LDAPServerIntegrity`) kept getting
overwritten back by the domain's Group Policy on every automatic refresh
cycle — so a local fix never stuck.

## Fix
Set `LDAPServerIntegrity = 1` directly in the **Default Domain Controllers
Policy** GPO instead of the local registry, so the setting survives GPO
refresh cycles. After that, LDAP login attempts progressed past the
signing check and started returning `invalidCredentials` instead —
confirming the network/protocol layer was now correct and the remaining
issue was simply the test account's password.

## Lesson
On a domain-joined machine, a local registry tweak that conflicts with a
GPO is a losing battle — GPO refresh will win eventually. Any AD-related
setting needs to be checked (and if necessary changed) at the policy level,
not just locally.
