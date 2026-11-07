(*---
description: A label in a function constructor has the bound name as parameter.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_function_constructor ----
Op == [x \in {1} |-> l(x):: x]
Test == Op!l(7) = 7
====

(*--- recorded
all:
  exit: 0
---*)
