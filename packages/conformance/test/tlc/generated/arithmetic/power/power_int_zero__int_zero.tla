(*---
description: ^ of int_zero and int_zero, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_int_zero__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) ^ (0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2180:0 0^0 is undefined.
    2180:0 0^0 is undefined.
---*)
