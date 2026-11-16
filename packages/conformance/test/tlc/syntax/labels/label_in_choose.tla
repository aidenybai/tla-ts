(*---
description: A label in a CHOOSE has the bound name as parameter.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_choose ----
Op == CHOOSE x \in {1} : l(x):: x = 1
Test == Op!l(1)
====

(*--- recorded
all:
  exit: 0
---*)
