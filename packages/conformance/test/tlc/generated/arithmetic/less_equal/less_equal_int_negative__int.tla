(*---
description: <= of int_negative and int, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_equal_int_negative__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) <= (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of <= should be an integer, but instead it is:
    Int
    2266:0 The second argument of <= should be an integer, but instead it is:
    Int
---*)
