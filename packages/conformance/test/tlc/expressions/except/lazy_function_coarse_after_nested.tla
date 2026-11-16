(*---
description: "A whole-key except after a nested one wins on a lazy function."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_coarse_after_nested ----
EXTENDS Integers
Test == [[x \in Nat |-> <<x, x>>] EXCEPT ![1][1] = 5, ![1] = <<0, 0>>][1] = <<0, 0>>
====

(*--- recorded
all:
  exit: 0
---*)
