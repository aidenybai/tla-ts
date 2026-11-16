(*---
description: Removing more than present removes the key.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_excess_removes_key ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) (-) (1 :> 5) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
