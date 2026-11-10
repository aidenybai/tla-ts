(*---
description: SubBag covers all combinations of keys and counts.
ref: tla2sany/StandardModules/Bags.tla
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE subbag_two_keys ----
EXTENDS Bags, TLC, Naturals, FiniteSets
Test == Cardinality(SubBag("a" :> 2 @@ "b" :> 1)) = 6
====

(*--- recorded
all:
  exit: 0
---*)
