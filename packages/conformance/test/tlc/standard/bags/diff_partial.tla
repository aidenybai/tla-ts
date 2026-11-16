(*---
description: (-) subtracts counts.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_partial ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 3) (-) (1 :> 1) = (1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
