(*---
description: "A nested except after a whole-key one applies on top of it on a lazy function."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_nested_after_coarse ----
EXTENDS Integers
Test == [[x \in Nat |-> <<x, x>>] EXCEPT ![1] = <<0, 0>>, ![1][1] = 5][1] = <<5, 0>>
====

(*--- recorded
all:
  exit: 0
---*)
