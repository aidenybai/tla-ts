(*---
description: A key in one bag only is copied without looking at its count.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_non_int_unshared_count ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1 :> "a", 2 :> "b"}) = (1 :> "a" @@ 2 :> "b")
====

(*--- recorded
all:
  exit: 0
---*)
