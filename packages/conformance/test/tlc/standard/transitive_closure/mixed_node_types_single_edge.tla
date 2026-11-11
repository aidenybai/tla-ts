(*---
description: A single edge between nodes of different types is accepted, because nothing compares them.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE mixed_node_types_single_edge ----
EXTENDS TransitiveClosure
Test == Warshall({<<1, "a">>}) = {<<1, "a">>}
====

(*--- recorded
all:
  exit: 0
---*)
