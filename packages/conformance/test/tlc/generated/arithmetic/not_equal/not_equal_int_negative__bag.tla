(*---
description: /= of int_negative and bag, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_negative__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) /= (SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_equal_int_negative__bag failed.
    Attempted to check equality of integer -3 with non-integer:
    <<1>>
---*)
