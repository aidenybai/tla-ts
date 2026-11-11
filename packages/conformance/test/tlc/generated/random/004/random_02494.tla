(*---
description: Evaluates a random record expression, seed 262, number 2494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE [[x \in Nat |-> x + 1] EXCEPT ![2] = 2] -> (CHOOSE b3925 \in {2, 1, 3} : TRUE) [] OTHER -> LET b3926 == 2147483647 IN 2147483647 % Cardinality({3, 3})), b |-> ((\A b3927 \in {2147483647, 2147483647} : (FALSE \/ FALSE)) <=> (({2, 1, 3} \cap {1, 2}) \subseteq DOMAIN (1 :> 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02494 failed.
    A non-boolean expression (a function of the form  [x \in S |-> expr]) was used as a condition of a CASE. line 14, col 29 to line 14, col 67 of module random_02494
---*)
