(*---
description: CopiesIn of an absent key is 0.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE copies_in_absent ----
EXTENDS Bags, TLC, Naturals
Test == CopiesIn(2, 1 :> 3) = 0 /\ CopiesIn(1, EmptyBag) = 0
====

(*--- recorded
all:
  exit: 0
---*)
