(*---
description: Two paths to one node yield one edge.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE diamond ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>, <<1, 3>>, <<2, 4>>, <<3, 4>>}) = {<<1, 2>>, <<1, 3>>, <<2, 4>>, <<3, 4>>, <<1, 4>>}
====

(*--- recorded
all:
  exit: 0
---*)
