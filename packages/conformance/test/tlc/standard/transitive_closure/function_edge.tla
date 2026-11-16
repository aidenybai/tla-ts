(*---
description: An edge given as a function with domain 1..2 converts through toTuple.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE function_edge ----
EXTENDS TransitiveClosure
Test == Warshall({[i \in {1, 2} |-> i]}) = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
