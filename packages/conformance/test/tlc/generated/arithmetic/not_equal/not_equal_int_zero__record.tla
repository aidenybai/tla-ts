(*---
description: /= of int_zero and record, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_zero__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) /= ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_equal_int_zero__record failed.
    Attempted to check equality of integer 0 with non-integer:
    [a |-> 1, b |-> 2]
---*)
