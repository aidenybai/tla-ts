(*---
description: <= of int_negative and function_lazy, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_equal_int_negative__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) <= ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of <= should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module less_equal_int_negative__function_lazy>]
    2266:0 The second argument of <= should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module less_equal_int_negative__function_lazy>]
---*)
