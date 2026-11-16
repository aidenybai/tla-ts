(*---
description: Evaluates a random int expression, seed 262, number 8131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) <=> (FALSE => FALSE)) THEN ([a |-> 7, b |-> TRUE]).a ELSE ((0 * 2147483647) \in UNION {{x \in 1..3 : x > 1}, 1..3}) \div Head(((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) \o SelectSeq(<<>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
