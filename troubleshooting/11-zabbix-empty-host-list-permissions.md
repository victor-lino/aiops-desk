# Bug: Zabbix `host.get` returned an empty list

## Symptom
`host.get`, called through the `aiops-api` Zabbix user, returned an empty
list — as if no hosts were registered at all.

## Root Cause
The lab actually had 8 hosts registered (`DC01`, `DC02`,
`DC03-Physical`, `NODE01`, `NODE02`, `pfSense`, `TrueNAS-Storage`,
`Zabbix-server`), several with active problems. The empty result wasn't
about missing hosts — the `aiops-api` user simply didn't have read
permission over the host groups they belonged to.

## Fix
Granted the `aiops-api` user read permission over the relevant host groups
via the **Admin TI** user group in Zabbix. Re-ran `host.get` and confirmed
all 8 hosts were returned correctly.

## Lesson
An empty result from an API is not proof that the underlying data is
empty — it can just as easily mean the caller's permissions are the actual
gap. Worth checking permissions before assuming the data itself is
missing, especially on a freshly created service account.
