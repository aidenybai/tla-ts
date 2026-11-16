(*---
description: "A set of records' operands are its value sets."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE record_set_values ----
Op == [a : {1}, b : {2}]
Test == Op!2 = {2}
====

(*--- recorded
all:
  exit: 0
---*)
