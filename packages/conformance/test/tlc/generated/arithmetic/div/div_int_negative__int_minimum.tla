(*---
description: \div of int_negative and int_minimum, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_int_negative__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \div ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
