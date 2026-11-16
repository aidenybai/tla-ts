(*---
description: Evaluates a random function expression, seed 262, number 6136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b9432 \in ({1} \ SUBSET {1}) : (TRUE \/ FALSE)) * [Tail(<<1, 2>>) EXCEPT !.a = (CHOOSE b9433 \in {2, 1, 3} : TRUE)]) :> (-IF (2..1 = 1..3) THEN ([a |-> 1]).a ELSE CASE SUBSET {1} -> 1 [] OTHER -> 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06136 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
