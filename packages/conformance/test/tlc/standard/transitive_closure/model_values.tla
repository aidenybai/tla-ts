(*---
description: Nodes can be model values.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
config: |
  CONSTANT a = a
  CONSTANT b = b
includes:
  - TransitiveClosure.tla
---*)
---- MODULE model_values ----
EXTENDS TransitiveClosure
CONSTANT a, b
Test == Warshall({<<a, b>>}) = {<<a, b>>}
====

(*--- recorded
all:
  exit: 0
---*)
