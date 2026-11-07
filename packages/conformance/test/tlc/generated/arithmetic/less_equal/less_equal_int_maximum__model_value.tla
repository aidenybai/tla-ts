(*---
description: <= of int_maximum and model_value, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE less_equal_int_maximum__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((2147483647) <= (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of <= should be an integer, but instead it is:
    mv
    2266:0 The second argument of <= should be an integer, but instead it is:
    mv
---*)
