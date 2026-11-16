(*---
description: Evaluates a random set expression, seed 262, number 8672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b13418 \in {b13419 : b13419 \in {2, 1, 3}} |-> (CHOOSE b13420 \in 2..1 : TRUE)] \cap (Cardinality({b13421 \in {2, 1, 3} : TRUE}) .. CASE (\A b13422 \in {1, 2} : TRUE) -> (1 - 1) [] OTHER -> LET b13423 == 0 IN 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08672 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 73 to line 14, col 101 of module random_08672
---*)
