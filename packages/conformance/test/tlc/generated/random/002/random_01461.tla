(*---
description: Evaluates a random record expression, seed 262, number 1461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = LET b2334 == (LET b2335 == <<3, 1, 2>> IN b2335 \div IF TRUE THEN -1 ELSE 2) IN Len(Append(<<>>, 3))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1]"
---*)
