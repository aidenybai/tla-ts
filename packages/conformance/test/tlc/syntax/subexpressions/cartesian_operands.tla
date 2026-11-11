(*---
description: "A \\X chain has one operand per factor."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE cartesian_operands ----
Op == {1} \X {2} \X {3}
Test == Op!3 = {3}
====

(*--- recorded
all:
  exit: 0
---*)
