(*---
description: Set difference may be applied in nonfix form.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_setminus ----
Test == \ ({1, 2}, {2}) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
