(*---
description: (+) keeps keys from both sides.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_disjoint ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) (+) (2 :> 2) = (1 :> 1 @@ 2 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
