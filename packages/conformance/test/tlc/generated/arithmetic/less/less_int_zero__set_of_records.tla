(*---
description: < of int_zero and set_of_records, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_int_zero__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) < ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2266:0 The second argument of < should be an integer, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
