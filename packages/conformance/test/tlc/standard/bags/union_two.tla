(*---
description: BagUnion adds counts across bags.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_two ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1 :> 1, 1 :> 2}) = (1 :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
