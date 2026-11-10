(*---
description: + of int_one and int_minimum, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_int_one__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) + ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483647"
---*)
