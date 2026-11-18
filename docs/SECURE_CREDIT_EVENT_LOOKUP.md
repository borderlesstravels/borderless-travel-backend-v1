# Secure local credit event lookup

This utility queries the production `creditevents` collection from your own
terminal. It prompts for the MongoDB URI with masked input, keeps it only in
process memory, and does not write the URI to a file, environment variable,
shell command, or log. It prints a small event summary only; it never prints
customer email, raw webhook bodies, amounts, or transaction references.

## Prepare a narrowly scoped database user

Preferred: in MongoDB Atlas, create a temporary user with a custom role
granting only the `find` action on the `creditevents` collection in the target
database. Do not use an Atlas owner or a role that grants access to every
database. Keep TLS enabled. The utility checks effective permissions. If the
account is broader than collection-level read-only, it warns and requires you
to type `READ` before continuing. Its code only issues `find` operations on
`creditevents`; it never mutates data. A narrow database role is still safer.

## Run it

From PowerShell:

```powershell
cd C:\Users\toluk\Downloads\Borderless\backend-production
npm.cmd run inspect:credit-events
```

Paste the URI at the hidden prompt. Do not pass it as a command argument or
paste it into chat. If the URI does not name a database, the utility lists
only database names this user can access and asks you to choose one. If that
is not permitted, it asks for the database name manually. It displays up to
100 newest events at a time and offers to continue through older pages. Use
`Ctrl+C` to cancel. It disconnects from MongoDB on completion or error. When
finished, revoke the temporary database user in Atlas and rotate any
credential that was shared in chat.
