(*---
description: Evaluates a random function expression, seed 262, number 4023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6323 \in DOMAIN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] :> Len(<<1>>)) |-> (Cardinality((CHOOSE r \in [a : {2, 1, 3}] : TRUE)) + (-(<<5, 6>>)[2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04023 failed.
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
