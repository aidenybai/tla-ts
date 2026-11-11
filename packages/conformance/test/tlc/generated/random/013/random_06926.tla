(*---
description: Evaluates a random record expression, seed 262, number 6926.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06926 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b10603 == LET b10604 == -1 IN b10604 IN (7 % 3), b |-> ((0 = 3) \/ (-1 \in Nat))] EXCEPT !.a = (((3 \div 2147483647) \div ([x \in Nat |-> x + 1])[3]) % ((3 + 3) * Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> FALSE]"
---*)
