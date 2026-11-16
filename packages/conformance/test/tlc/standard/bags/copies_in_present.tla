(*---
description: CopiesIn returns the count.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE copies_in_present ----
EXTENDS Bags, TLC, Naturals
Test == CopiesIn(1, 1 :> 3) = 3
====

(*--- recorded
all:
  exit: 0
---*)
