(*---
description: A chain of four edges gains all ten pairs.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE long_chain ----
EXTENDS TransitiveClosure, Naturals
Test == Warshall({<<1, 2>>, <<2, 3>>, <<3, 4>>, <<4, 5>>}) = {<<i, j>> \in (1..5) \X (1..5) : i < j}
====

(*--- recorded
all:
  exit: 0
---*)
