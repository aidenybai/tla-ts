(*---
description: Evaluates a random bool expression, seed 262, number 1089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<LET b1735 == IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 3 IN Cardinality({2, 1, 3}), (CHOOSE b1736 \in ({1, 2} \ {1}) : (<<>> = [x \in Nat |-> x + 1]))>> = ((((1 :> 2) @@ [x \in 1..2 |-> x]) @@ {[x \in Nat |-> x + 1] : b1737 \in Nat}) @@ (Len(<<1, 2>>) :> LET b1738 == 3 IN b1738))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01089 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
