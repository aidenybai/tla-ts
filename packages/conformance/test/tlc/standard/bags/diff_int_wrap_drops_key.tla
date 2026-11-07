(*---
description: BagDiff subtracts with plain int arithmetic, so subtracting -1 from 2^31-1 wraps negative and removes the key, where the TLA+ definition overflows. Real TLC bug.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE diff_int_wrap_drops_key ----
EXTENDS Bags, TLC, Integers
Test == (1 :> 2147483647) (-) (1 :> -1) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
