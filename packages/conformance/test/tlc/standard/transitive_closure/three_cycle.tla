(*---
description: A three-cycle produces all nine pairs.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE three_cycle ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>, <<2, 3>>, <<3, 1>>}) = {1, 2, 3} \X {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
