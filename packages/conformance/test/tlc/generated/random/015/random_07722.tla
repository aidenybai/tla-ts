(*---
description: Evaluates a random bool expression, seed 262, number 7722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2}] : TRUE) = [[[{} EXCEPT !.a = @ + 2] EXCEPT !.a = Cardinality({x \in 1..3 : x > 1})] EXCEPT !.a = Len(SortSeq(3, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07722 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
