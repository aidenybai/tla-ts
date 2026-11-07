(*---
description: <= of int_one and function, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_equal_int_one__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) <= ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of <= should be an integer, but instead it is:
    <<2, 4>>
    2266:0 The second argument of <= should be an integer, but instead it is:
    <<2, 4>>
---*)
