(*---
description: A two-cycle produces self-loops on both nodes.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE two_cycle ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, 2>>, <<2, 1>>}) = {1, 2} \X {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
