(*---
description: A name selector may follow an operand selector when that operand is a LET.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE operand_then_let_name ----
Op == (LET a == 3 IN a) = 3
Test == Op!1!a = 3
====

(*--- recorded
all:
  exit: 0
---*)
