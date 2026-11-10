(*---
description: Evaluates a random bool expression, seed 262, number 9865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-([x \in Nat |-> x + 1])[7]) \div Cardinality({2 : b15325 \in [a |-> 1]})) = ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09865 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 81 to line 14, col 89 of module random_09865
---*)
