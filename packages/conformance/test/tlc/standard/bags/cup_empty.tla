(*---
description: An empty side yields the other.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_empty ----
EXTENDS Bags, TLC, Naturals
Test == EmptyBag (+) (1 :> 1) = (1 :> 1) /\ (1 :> 1) (+) EmptyBag = (1 :> 1) /\ EmptyBag (+) EmptyBag = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
