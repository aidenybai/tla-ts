(*---
description: "EXCEPT on a function over Nat changes one key and leaves the function lazy."
ref: "tlc2/value/impl/FcnLambdaValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_changed_key ----
EXTENDS Integers
Test == LET f == [[x \in Nat |-> x] EXCEPT ![1] = 7] IN f[1] = 7 /\ f[2] = 2
====

(*--- recorded
all:
  exit: 0
---*)
