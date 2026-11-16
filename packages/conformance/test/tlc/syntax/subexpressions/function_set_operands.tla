(*---
description: A function set has domain and range operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE function_set_operands ----
Op == [{1} -> {2}]
Test == Op!1 = {1} /\ Op!2 = {2}
====

(*--- recorded
all:
  exit: 0
---*)
