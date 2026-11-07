(*---
description: /= of int_minimum and int_maximum, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_equal_int_minimum__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) /= (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
