(*---
description: Evaluates a random int expression, seed 262, number 369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((([[a |-> 1] EXCEPT !.a = 2147483647]).a .. ((2147483647 * 7) * Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*7
    2178:0 Overflow when computing 2147483647*7
---*)
