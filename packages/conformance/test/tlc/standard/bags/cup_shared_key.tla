(*---
description: (+) adds counts on shared keys.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_shared_key ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) (+) (1 :> 2) = (1 :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
