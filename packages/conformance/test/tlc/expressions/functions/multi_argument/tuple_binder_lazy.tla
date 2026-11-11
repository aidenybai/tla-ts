(*---
description: "A tuple binder over Nat \\X Nat stays lazy and destructures its argument."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_lazy ----
EXTENDS Integers
Test == [<<a, b>> \in Nat \X Nat |-> a + b][<<1, 2>>] = 3
====

(*--- recorded
all:
  exit: 0
---*)
