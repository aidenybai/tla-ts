(*---
description: Evaluates a random function expression, seed 262, number 7031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(CHOOSE b10785 \in {1, 2} : b10785), (CHOOSE b10786 \in {1, 2} : TRUE)}) :> Cardinality((UNION {{x \in 1..3 : x > 1}, SUBSET {1}} \ DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07031 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 31 to line 14, col 63 of module random_07031
---*)
