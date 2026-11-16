(*---
description: Evaluates a random bool expression, seed 262, number 1120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((2 % 2147483647) * LET b1794 == 2 IN 7)) <=> ((CASE TRUE -> 0 [] OTHER -> 2 - Head(<<3, 1, 2>>)) = (CHOOSE b1795 \in {b1796 : b1796 \in {2, 1, 3}} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01120 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 17 to line 14, col 217 of module random_01120
---*)
