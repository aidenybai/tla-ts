(*---
description: Evaluates a random function expression, seed 262, number 4177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(({1, 2} \subseteq {1}) \/ (<<>> = [x \in Nat |-> x + 1]))] = (Cardinality(<<3, 1, 2>>) \div LET b6566 == 0 IN 0)] @@ (([b6567 \in {} |-> 7] @@ (-1 :> -1)) @@ ((CHOOSE b6568 \in Nat : TRUE) :> Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04177 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
