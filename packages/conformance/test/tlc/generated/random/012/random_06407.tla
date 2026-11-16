(*---
description: Evaluates a random record expression, seed 262, number 6407.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06407 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ((-IF TRUE THEN 2147483647 ELSE -1) \div LET b9857 == (-2) IN Len(<<1>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -2147483646]"
---*)
