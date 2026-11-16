(*---
description: Evaluates a random bool expression, seed 262, number 1792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<3, 1, 2>> = -1) <=> (FALSE => FALSE)) \/ (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (TRUE \/ FALSE))) <=> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = (CHOOSE b2844 \in {2, 1, 3} : TRUE)] \/ (IF TRUE THEN 7 ELSE 1 = (2147483647 * 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01792 failed.
    Attempted to check equality of the function <<3, 1, 2>> with the value:
    -1
---*)
