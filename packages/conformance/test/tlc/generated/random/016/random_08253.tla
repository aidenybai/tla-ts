(*---
description: Evaluates a random function expression, seed 262, number 8253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {DOMAIN <<5, 6>>, ({1, 2} \ SUBSET {1})}) :> (-(-(3 % 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08253 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
