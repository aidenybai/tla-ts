(*---
description: < of int_zero and bag, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_int_zero__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) < (SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module less_int_zero__bag failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    <<1>>
---*)
