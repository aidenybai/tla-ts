(*---
description: Evaluates a random record expression, seed 262, number 1800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (<<1>> = [x \in Nat |-> x + 1]) THEN Head(<<1, 2>>) ELSE (2 - 1), b |-> (LET b2850 == {x \in 1..3 : x > 1} IN 2 < (3 :> -1))] EXCEPT !.a = ([[(1 :> 2) EXCEPT ![1] = 2147483647] EXCEPT ![LET b2851 == 2147483647 IN 7] = (CHOOSE b2852 \in [a |-> 1] : TRUE)])[Cardinality((TRUE \/ FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01800 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
