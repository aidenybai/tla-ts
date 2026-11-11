(*---
description: Evaluates a random int expression, seed 262, number 5499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8504 \in (<<(-1 + 0), (-7)>> \o SortSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)) : ({Cardinality({}), ([x \in 1..2 |-> x])[7]} = [a |-> ([x \in Nat |-> x + 1])[b8504], b |-> (FALSE \/ FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05499 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 17 to line 14, col 233 of module random_05499
---*)
