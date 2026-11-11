(*---
description: .. of int_minimum and int_one, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_int_minimum__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) .. (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483648..1"
---*)
