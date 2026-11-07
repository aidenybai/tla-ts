(*---
description: An empty bag has cardinality 0.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cardinality_empty ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(EmptyBag) = 0
====

(*--- recorded
all:
  exit: 0
---*)
