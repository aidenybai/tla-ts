(*---
description: Evaluates a random record expression, seed 262, number 8156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> LET b12617 == -1 IN <<5, 6>>, b |-> (\E b12618 \in 1..3 : TRUE)] EXCEPT !.a = (IF TRUE THEN 1 ELSE [x \in Nat |-> x + 1] \div <<2, 7>>)] EXCEPT !.a = (-(LET b12619 == 2 IN b12619 + Head(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -5, b |-> TRUE]"
---*)
