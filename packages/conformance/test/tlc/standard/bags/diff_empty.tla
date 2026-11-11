(*---
description: An empty side yields the left bag or EmptyBag.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_empty ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) (-) EmptyBag = (1 :> 1) /\ EmptyBag (-) (1 :> 1) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
