(*---
description: /= of int_minimum and seq_set, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_minimum__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) /= (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_equal_int_minimum__seq_set failed.
    Attempted to check equality of integer -2147483648 with non-integer:
    Seq({1})
---*)
