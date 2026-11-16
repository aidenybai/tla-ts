(*---
description: Evaluates a random int expression, seed 262, number 2482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b3902 == LET b3903 == (-2147483647) IN ((1 :> 2))[b3903] IN IF (TRUE \/ FALSE) THEN Len(<<3, 1, 2>>) ELSE (b3902 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
