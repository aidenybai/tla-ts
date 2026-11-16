(*---
description: "An inner lazy function captures the outer binding."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE function_of_functions_capture ----
EXTENDS Integers
Test == [k \in 1..2 |-> [y \in Nat |-> y + k]][2][1] = 3
====

(*--- recorded
all:
  exit: 0
---*)
