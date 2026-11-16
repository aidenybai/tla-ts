(*---
description: /= of int_maximum and function_lazy, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_maximum__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) /= ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_equal_int_maximum__function_lazy failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    [x \in Nat |-> <expression line 14, col 48 to line 14, col 48 of module not_equal_int_maximum__function_lazy>]
---*)
