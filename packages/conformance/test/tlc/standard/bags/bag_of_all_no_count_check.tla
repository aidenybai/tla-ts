(*---
description: With no merge, a non-integer count is copied unchecked.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_of_all_no_count_check ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x, 1 :> "a") = (1 :> "a")
====

(*--- recorded
all:
  exit: 0
---*)
