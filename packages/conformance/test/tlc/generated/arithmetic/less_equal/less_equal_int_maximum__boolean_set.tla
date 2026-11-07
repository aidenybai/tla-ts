(*---
description: <= of int_maximum and boolean_set, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_equal_int_maximum__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) <= (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of <= should be an integer, but instead it is:
    {FALSE, TRUE}
    2266:0 The second argument of <= should be an integer, but instead it is:
    {FALSE, TRUE}
---*)
