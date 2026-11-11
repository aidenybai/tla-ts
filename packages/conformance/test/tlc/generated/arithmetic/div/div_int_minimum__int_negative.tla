(*---
description: \div of int_minimum and int_negative, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_int_minimum__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \div (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 715827882"
---*)
