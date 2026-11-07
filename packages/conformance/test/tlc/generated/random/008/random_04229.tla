(*---
description: Evaluates a random int expression, seed 262, number 4229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Len(SortSeq(<<2147483647, -1>>, LAMBDA p, q : p < q)), (IF (\E b6647 \in SUBSET {1} : TRUE) THEN (3 - -1) ELSE (2147483647 \div 3) - LET b6648 == (2 \div 2) IN (b6648 * b6648))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4>>"
---*)
