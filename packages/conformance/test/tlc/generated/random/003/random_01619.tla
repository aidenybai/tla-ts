(*---
description: Evaluates a random record expression, seed 262, number 1619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<1, 2>> EXCEPT ![1] = 1] EXCEPT ![1] = (CHOOSE b2582 \in {} : TRUE)] \o [<<0, 1>> EXCEPT ![1] = Len([a |-> 1, b |-> TRUE])]) = (Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) :> (Cardinality(1..3) + (2 - -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01619 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 61 to line 14, col 86 of module random_01619
---*)
