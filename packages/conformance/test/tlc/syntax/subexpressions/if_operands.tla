(*---
description: IF has three operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE if_operands ----
Op == IF TRUE THEN 1 ELSE 2
Test == Op!1 /\ Op!2 = 1 /\ Op!3 = 2
====

(*--- recorded
all:
  exit: 0
---*)
