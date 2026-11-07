(*---
description: Evaluates a random record expression, seed 262, number 9953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) = ((1 :> 2))[2147483647]) -> Cardinality({2 : b15479 \in {1, 2}}) [] OTHER -> ((<<5, 6>>)[2] * ([a |-> 1]).a), b |-> (((7 \div 1) < CASE FALSE -> 7 [] OTHER -> 7) \/ ((SUBSET {1} = {1}) => (3 \in {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09953 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
