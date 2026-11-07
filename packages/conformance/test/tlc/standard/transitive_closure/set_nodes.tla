(*---
description: Nodes can be sets, told apart by value.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE set_nodes ----
EXTENDS TransitiveClosure
Test == Warshall({<<{1}, {2}>>, <<{2}, {1}>>}) = {{1}, {2}} \X {{1}, {2}}
====

(*--- recorded
all:
  exit: 0
---*)
