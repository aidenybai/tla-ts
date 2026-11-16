(*---
description: Evaluates a random function expression, seed 262, number 2439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b3849 == Cardinality({1, 1}) IN CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (-3) [] OTHER -> Cardinality({1}) :> IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) THEN Len(SubSeq(<<>>, [x \in 1..2 |-> x], 3)) ELSE LET b3850 == (CHOOSE b3851 \in 2..1 : FALSE) IN (2 * b3850)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3"
---*)
