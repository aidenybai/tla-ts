(*---
description: Evaluates a random bool expression, seed 262, number 996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b1596 \in 1..3 |-> <<5, 6>>] @@ (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)))[(CHOOSE b1597 \in ({1} \cup 2..1) : [[a |-> 1, b |-> TRUE] EXCEPT ![1] = b1597])] = (Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) * ((-7) % ((1 :> 2))[1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00996 failed.
    Attempted to access record by a non-string argument: 1
---*)
