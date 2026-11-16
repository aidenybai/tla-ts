(*---
description: "\\lor may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_lor ----
Test == \lor(FALSE, TRUE)
====

(*--- recorded
all:
  exit: 0
---*)
