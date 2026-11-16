(*---
description: Evaluates a random record expression, seed 262, number 4006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b6294 \in 1..3 : TRUE)] EXCEPT !.a = (((1 :> 2))[7] + (-0))] EXCEPT !.a = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + {b6295 \in 2..1 : TRUE}] = [[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = LET b6296 == 2147483647 IN b6296])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04006 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
