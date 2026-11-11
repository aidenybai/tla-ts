(*---
description: One edge is its own closure.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE single_edge ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>}) = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
