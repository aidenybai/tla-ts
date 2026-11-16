(*---
description: "A dot selection's operands are the record and the field as a string."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE record_select_operands ----
Op == [a |-> 1].a
Test == Op!1 = [a |-> 1] /\ Op!2 = "a"
====

(*--- recorded
all:
  exit: 0
---*)
