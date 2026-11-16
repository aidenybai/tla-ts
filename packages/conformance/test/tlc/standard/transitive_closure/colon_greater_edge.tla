(*---
description: An edge built with :> and @@ converts through toTuple.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: success
includes:
  - TransitiveClosure.tla
---*)
---- MODULE colon_greater_edge ----
EXTENDS TransitiveClosure, TLC
Test == Warshall({(1 :> 7) @@ (2 :> 8)}) = {<<7, 8>>}
====

(*--- recorded
all:
  exit: 0
---*)
