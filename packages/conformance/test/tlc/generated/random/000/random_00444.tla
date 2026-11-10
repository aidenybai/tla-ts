(*---
description: Evaluates a random set expression, seed 262, number 444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((<<5, 6>>)[2] - Cardinality(Nat)), ((1 - 0) + (3 + 3))} \cap ((DOMAIN (1 :> 2) \cap [[x \in Nat |-> x + 1] EXCEPT ![2] = 0]) \cap {b725 \in {b726 : b726 \in {1, 2}} : (b725 = 7)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00444 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
