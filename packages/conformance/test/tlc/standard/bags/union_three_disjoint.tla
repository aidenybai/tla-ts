(*---
description: BagUnion gathers disjoint keys.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_three_disjoint ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1 :> 1, 2 :> 1, 3 :> 1}) = (1 :> 1 @@ 2 :> 1 @@ 3 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
