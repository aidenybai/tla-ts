(*---
description: "# may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_not_equals ----
Test == #(1, 2)
====

(*--- recorded
all:
  exit: 0
---*)
