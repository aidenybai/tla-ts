(*---
description: "A LET definition is reached with !:!."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE let_name_through_colon ----
Op == LET a == 3 IN a = 3
Test == Op!:!a = 3
====

(*--- recorded
all:
  exit: 0
---*)
