(*---
description: A filter expression enumerates into edges.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE filter_relation ----
EXTENDS TransitiveClosure, Naturals
Test == Warshall({e \in {<<1, 2>>, <<2, 3>>, <<3, 1>>} : e[1] < e[2]}) = {<<1, 2>>, <<2, 3>>, <<1, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
