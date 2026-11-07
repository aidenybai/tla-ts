(*---
description: Evaluates a random function expression, seed 262, number 4152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a % (7 % 1)) \div (Cardinality({2, 1, 3}) \div IF FALSE THEN 2 ELSE 7)) :> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = (7 * 0)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
