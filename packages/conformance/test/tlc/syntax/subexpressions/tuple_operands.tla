(*---
description: Elements of a tuple are operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE tuple_operands ----
Op == <<1, 2, 3>>
Test == Op!3 = 3
====

(*--- recorded
all:
  exit: 0
---*)
