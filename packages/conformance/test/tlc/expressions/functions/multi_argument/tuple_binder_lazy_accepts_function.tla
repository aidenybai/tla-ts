(*---
description: "A lazy tuple binder converts a function argument through toTuple."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_lazy_accepts_function ----
EXTENDS Integers
Test == [<<a, b>> \in Nat \X Nat |-> a + b][[i \in 1..2 |-> i]] = 3
====

(*--- recorded
all:
  exit: 0
---*)
