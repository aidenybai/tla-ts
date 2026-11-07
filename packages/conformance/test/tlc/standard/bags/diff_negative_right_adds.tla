(*---
description: A negative count on the right adds copies, since (-) subtracts it without a bag check.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_negative_right_adds ----
EXTENDS Bags, TLC, Integers
Test == (1 :> 1) (-) (1 :> -1) = (1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
