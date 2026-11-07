(*---
description: < of int_negative and false, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_int_negative__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) < (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
---*)
