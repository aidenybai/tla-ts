(*---
description: ^ of int_negative and int_one, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_int_negative__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) ^ (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
