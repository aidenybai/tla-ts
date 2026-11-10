(*---
description: A label in a set filter has the bound name as parameter.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_set_filter ----
Op == {x \in {1} : l(x):: x = 1}
Test == Op!l(1)
====

(*--- recorded
all:
  exit: 0
---*)
