(*---
description: Items of a junction list are operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE conjunction_list_items ----
Op == /\ 1 = 1
      /\ 2 = 2
Test == Op!1 /\ Op!2 /\ Op!1!1 = 1 /\ Op!2!>> = 2
====

(*--- recorded
all:
  exit: 0
---*)
