(*---
description: + of int_maximum and int_maximum, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_int_maximum__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) + (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module plus_int_maximum__int_maximum failed.
    2178:0 Overflow when computing 2147483647+2147483647
---*)
