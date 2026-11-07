(*---
description: Evaluates a random record expression, seed 262, number 8962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {[x \in Nat |-> x + 1], [a |-> 1]} \cup DOMAIN [x \in 1..2 |-> x]) \ {((1 :> 2))[7], (CHOOSE b13897 \in [a |-> 1, b |-> TRUE] : TRUE)}) \subseteq DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08962 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
