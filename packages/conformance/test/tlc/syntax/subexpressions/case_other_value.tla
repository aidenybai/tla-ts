(*---
description: "An OTHER arm's value is !i!2."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE case_other_value ----
Op == CASE FALSE -> 1 [] OTHER -> 2
Test == Op!2!2 = 2
====

(*--- recorded
all:
  exit: 0
---*)
