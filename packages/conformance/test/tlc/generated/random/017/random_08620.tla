(*---
description: Evaluates a random bool expression, seed 262, number 8620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(3 * 2), {b13353 \in {1} : TRUE}} \ {b13354 \in (7 .. 0) : (3 = b13354)}) = (Cardinality({2, 0}) .. ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08620 failed.
    Attempted to compare the set {1} with the value:
    6
---*)
