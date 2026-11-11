(*---
description: Evaluates a random int expression, seed 262, number 6990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b10705 \in {2, 2} |-> (1 % 7)])[(Cardinality({}) * (1 - 2))] % ((CHOOSE b10706 \in DOMAIN [x \in 1..2 |-> x] : (7 < 0)) % ((CHOOSE b10707 \in {} : FALSE) - (-7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06990 failed.
    In applying the function
    (2 :> 1),
    the first argument is:
    0
    which is not in its domain.
---*)
