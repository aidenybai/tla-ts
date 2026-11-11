(*---
description: Evaluates a random seq expression, seed 262, number 1725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(([[2 EXCEPT !.a = @ + -1] EXCEPT !.a = (1 \div 0)] = (CHOOSE r \in [a : {1, 2}] : TRUE)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01725 failed.
    Attempted to apply EXCEPT construct to the value 2.
---*)
