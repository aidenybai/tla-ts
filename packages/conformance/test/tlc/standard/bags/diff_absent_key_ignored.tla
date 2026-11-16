(*---
description: Keys only on the right are ignored.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_absent_key_ignored ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) (-) (2 :> 5) = (1 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
