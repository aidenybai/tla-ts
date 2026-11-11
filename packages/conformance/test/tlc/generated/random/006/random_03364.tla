(*---
description: Evaluates a random set expression, seed 262, number 3364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN (2 * 1)) .. (CHOOSE b5342 \in DOMAIN [(1 :> 2) EXCEPT ![0] = -1] : SelectSeq(SubSeq(<<3, 1, 2>>, {1, 2}, 7), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03364 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 29 to line 14, col 42 of module random_03364
---*)
