(*---
description: Evaluates a random seq expression, seed 262, number 2856.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02856 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<(IF TRUE THEN 2147483647 ELSE 2 - (TRUE % -1)), Len(Tail(<<3, 1, 2>>))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2147483647>>"
---*)
