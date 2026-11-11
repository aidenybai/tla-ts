(*---
description: A chain gains the transitive edge.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE chain ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>, <<2, 3>>}) = {<<1, 2>>, <<2, 3>>, <<1, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
