(*---
description: "A lazy function returned by an operator keeps the parameter it captured."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE function_returned_from_operator ----
EXTENDS Integers
G(k) == [y \in Nat |-> y + k]
Test == G(1)[2] = 3 /\ G(2)[2] = 4
====

(*--- recorded
all:
  exit: 0
---*)
