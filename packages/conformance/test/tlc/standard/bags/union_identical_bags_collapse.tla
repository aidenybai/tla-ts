(*---
description: "A set holding the same bag twice collapses first: BagUnion({b, b}) = b, not b (+) b."
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_identical_bags_collapse ----
EXTENDS Bags, TLC, Naturals
Test == LET h == [i \in 1..3 |-> 1] IN BagUnion({h, h}) = h
====

(*--- recorded
all:
  exit: 0
---*)
