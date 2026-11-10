(*---
description: Evaluates a random set expression, seed 262, number 820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b1345 \in DOMAIN (1 :> 2) : ({x \in 1..3 : x > 1} \subseteq SUBSET {1})}) .. (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00820 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
