(*---
description: A set of tuples value enumerates into edges.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE cross_product_relation ----
EXTENDS TransitiveClosure
Test == Warshall({1, 2} \X {2, 3}) = {1, 2} \X {2, 3} \cup {<<2, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
