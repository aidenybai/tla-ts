(*---
description: Evaluates a random seq expression, seed 262, number 5352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(<<CASE TRUE -> 7 [] OTHER -> 0, (2 * 3)>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<6, 7>>"
---*)
