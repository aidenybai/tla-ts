(*---
description: BagUnion({}) is the empty bag.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_empty_set ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({}) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
