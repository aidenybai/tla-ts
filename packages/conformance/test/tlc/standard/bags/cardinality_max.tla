(*---
description: A sum of exactly 2^31-1 fits.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cardinality_max ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(1 :> 2147483646 @@ 2 :> 1) = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
