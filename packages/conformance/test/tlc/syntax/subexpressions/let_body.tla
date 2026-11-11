(*---
description: "A LET's single operand is its body."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE let_body ----
Op == LET a == 3 IN a = 3
Test == Op!1
====

(*--- recorded
all:
  exit: 0
---*)
