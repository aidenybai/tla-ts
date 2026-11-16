(*---
description: "* of int_one and int_zero, including overflow and type errors."
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE times_int_one__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) * (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
