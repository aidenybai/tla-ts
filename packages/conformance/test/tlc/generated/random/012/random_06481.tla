(*---
description: Evaluates a random record expression, seed 262, number 6481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = LET b9967 == CASE ([a |-> 1, b |-> TRUE]).a -> (0 - 7) [] OTHER -> IF TRUE THEN 3 ELSE 3 IN ((2 + b9967) * Len(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06481 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 80 to line 14, col 104 of module random_06481
---*)
