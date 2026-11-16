(*---
description: One element returns as is with no check, so BagUnion({3}) = 3 where the TLA+ definition would fail on BagToSet(3).
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_singleton_returns_element ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({3}) = 3
====

(*--- recorded
all:
  exit: 0
---*)
