(*---
description: "A record constructor's operands are its values."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE record_constructor_values ----
Op == [a |-> 1, b |-> 2]
Test == Op!1 = 1 /\ Op!2 = 2
====

(*--- recorded
all:
  exit: 0
---*)
