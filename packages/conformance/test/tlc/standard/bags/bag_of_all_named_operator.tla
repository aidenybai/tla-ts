(*---
description: A named operator works.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_of_all_named_operator ----
EXTENDS Bags, TLC, Naturals
F(x) == x + 1
Test == BagOfAll(F, 1 :> 1) = (2 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
