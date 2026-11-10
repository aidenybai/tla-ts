(*---
description: .. of int_minimum and int_negative, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_int_minimum__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) .. (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483648..-3"
---*)
