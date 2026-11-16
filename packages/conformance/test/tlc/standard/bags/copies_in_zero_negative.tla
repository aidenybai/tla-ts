(*---
description: CopiesIn returns a zero or negative count as is, with no bag check.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE copies_in_zero_negative ----
EXTENDS Bags, TLC, Integers
Test == CopiesIn(1, 1 :> 0) = 0 /\ CopiesIn(1, 1 :> -1) = -1
====

(*--- recorded
all:
  exit: 0
---*)
