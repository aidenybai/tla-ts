(*---
description: "Two nested excepts on one lazy key both apply, in order."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_two_nested_keys ----
EXTENDS Integers
Test == [[x \in Nat |-> <<x, x>>] EXCEPT ![1][1] = 5, ![1][2] = 6][1] = <<5, 6>>
====

(*--- recorded
all:
  exit: 0
---*)
