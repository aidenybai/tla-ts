(*---
description: "(-) does not check bag-ness: a left zero count disappears even with nothing removed."
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_drops_zero_count_without_check ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 0) (-) EmptyBag = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
