(*---
description: Disjoint components stay disjoint.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE disjoint_components ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>, <<3, 4>>}) = {<<1, 2>>, <<3, 4>>}
====

(*--- recorded
all:
  exit: 0
---*)
