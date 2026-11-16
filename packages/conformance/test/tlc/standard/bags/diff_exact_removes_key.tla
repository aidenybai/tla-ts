(*---
description: Removing every copy removes the key.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_exact_removes_key ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 2) (-) (1 :> 2) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
