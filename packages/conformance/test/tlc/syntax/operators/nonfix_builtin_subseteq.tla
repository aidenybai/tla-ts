(*---
description: "\\subseteq may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_subseteq ----
Test == \subseteq({}, {})
====

(*--- recorded
all:
  exit: 0
---*)
