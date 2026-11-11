(*---
description: The closure of the empty relation is empty.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE empty_relation ----
EXTENDS TransitiveClosure
Test == Warshall({}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
