(*---
description: Evaluates a random record expression, seed 262, number 5789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ((2147483647 + -1) \div IF FALSE THEN 1 ELSE 3)] EXCEPT !.a = LET b8924 == (-LET b8925 == 1 IN 0) IN (Len(<<>>) - CASE TRUE -> 2147483647 [] OTHER -> b8924)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -2147483647]"
---*)
