(*---
description: Evaluates a random seq expression, seed 262, number 1451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SortSeq(<<0, 3>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), (IF (1..3 = 1..3) THEN (0 \div 2) ELSE (2 % 1) + ((-1 - 1) + LET b2319 == 3 IN -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 3, 0>>"
---*)
