(*---
description: Evaluates a random seq expression, seed 262, number 2502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(CHOOSE b3937 \in {2, 2147483647} : (<<>> = [x \in Nat |-> x + 1])), (CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE)>> EXCEPT ![1] = (([b3938 \in {1} |-> b3938] @@ (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)) @@ [([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) EXCEPT ![(3 + 2147483647)] = LET b3939 == 2147483647 IN 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02502 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
