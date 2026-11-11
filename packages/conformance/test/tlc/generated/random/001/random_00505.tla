(*---
description: Evaluates a random record expression, seed 262, number 505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))[((CHOOSE f \in [{1} -> {1}] : TRUE))[(CHOOSE b842 \in {} : FALSE)]], b |-> (DOMAIN (2147483647 :> -1) = {Len(<<>>), ([x \in 1..2 |-> x])[0]})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00505 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 132 to line 14, col 157 of module random_00505
---*)
