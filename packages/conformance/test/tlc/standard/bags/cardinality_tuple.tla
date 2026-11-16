(*---
description: A tuple of positive integers has their sum.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cardinality_tuple ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(<<1, 2>>) = 3
====

(*--- recorded
all:
  exit: 0
---*)
