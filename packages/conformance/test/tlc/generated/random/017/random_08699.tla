(*---
description: Evaluates a random int expression, seed 262, number 8699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13463 \in {([a |-> 1]).a, ((1 :> 2))[1]} |-> (-(<<5, 6>>)[b13463])])[((CHOOSE b13464 \in {b13465 \in [a |-> 1, b |-> TRUE] : FALSE} : (~FALSE)) \div (((1 :> 2) :> [a |-> 1]))[Cardinality({2, 1, 3})])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08699 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable
---*)
