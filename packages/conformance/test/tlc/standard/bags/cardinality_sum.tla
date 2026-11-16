(*---
description: BagCardinality sums the counts.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cardinality_sum ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(1 :> 2 @@ 2 :> 3) = 5
====

(*--- recorded
all:
  exit: 0
---*)
