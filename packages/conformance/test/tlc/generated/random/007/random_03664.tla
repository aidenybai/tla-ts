(*---
description: Evaluates a random int expression, seed 262, number 3664.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03664 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5787 == LET b5788 == ([[a |-> 1] EXCEPT !.a = 0]).a IN CASE (\E b5789 \in b5788 : TRUE) -> LET b5790 == b5788 IN 2147483647 [] OTHER -> Cardinality({}) IN ([(1 :> b5787) EXCEPT ![Cardinality({2, 1, 3})] = (b5787 + 3)])[CASE (~TRUE) -> Cardinality({}) [] OTHER -> (b5787 - 2)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03664 failed.
    TLC encountered a non-enumerable quantifier bound
    0.
    line 14, col 95 to line 14, col 99 of module random_03664
---*)
