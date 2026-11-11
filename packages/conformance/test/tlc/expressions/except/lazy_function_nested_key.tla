(*---
description: "A lazy function applies a nested except to the computed body."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_nested_key ----
EXTENDS Integers
Test == [[x \in Nat |-> <<x, x>>] EXCEPT ![1][2] = 7][1] = <<1, 7>>
====

(*--- recorded
all:
  exit: 0
---*)
