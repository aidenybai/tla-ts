(*---
description: Evaluates a random int expression, seed 262, number 5544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN Head(<<3, 1, 2>>) ELSE Cardinality({2, 1, 3}) % (([a |-> 1, b |-> TRUE]).a \div CASE FALSE -> 2 [] OTHER -> 2)) - IF ((2 < 2) \/ (FALSE \/ FALSE)) THEN [b8576 \in (-1 .. 1) |-> (b8576 % b8576)] ELSE Len([<<1, 2>> EXCEPT ![1] = 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05544 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
