(*---
description: Items of a disjunction list are operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE disjunction_list_items ----
Op == \/ 1 = 2
      \/ 2 = 2
Test == ~Op!1 /\ Op!2
====

(*--- recorded
all:
  exit: 0
---*)
