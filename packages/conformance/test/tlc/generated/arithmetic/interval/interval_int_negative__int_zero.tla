(*---
description: .. of int_negative and int_zero, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_int_negative__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) .. (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3..0"
---*)
