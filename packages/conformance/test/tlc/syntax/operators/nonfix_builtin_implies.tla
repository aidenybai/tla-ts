(*---
description: "=> may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_implies ----
Test == =>(FALSE, FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
