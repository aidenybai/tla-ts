(*---
description: Evaluates a random int expression, seed 262, number 500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SortSeq(SubSeq([[a |-> 1] EXCEPT ![1] = 1], CASE TRUE -> 0 [] OTHER -> 3, (CHOOSE b827 \in {x \in 1..3 : x > 1} : FALSE)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00500 failed.
    Attempted to access record by a non-string argument: 1
---*)
