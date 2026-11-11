(*---
description: <= of int_negative and function_pair_domain, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_equal_int_negative__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) <= ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module less_equal_int_negative__function_pair_domain failed.
    2266:0 The second argument of <= should be an integer, but instead it is:
    (<<1, 2>> :> 3)
---*)
