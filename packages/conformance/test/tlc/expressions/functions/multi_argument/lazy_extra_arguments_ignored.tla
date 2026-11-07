(*---
description: "A lazy multi-bound function never checks the argument count, so a third argument is ignored. TLC should report that the argument is outside the domain."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
features: [tlc-bug]
flags: [expression]
outcome: success
---*)
---- MODULE lazy_extra_arguments_ignored ----
EXTENDS Integers
Test == [x, y \in Nat |-> x + y][1, 2, 3] = 3
====

(*--- recorded
all:
  exit: 0
---*)
