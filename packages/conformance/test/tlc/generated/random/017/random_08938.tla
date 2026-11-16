(*---
description: Evaluates a random record expression, seed 262, number 8938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SortSeq(Append(<<3, 1, 2>>, 1), LAMBDA p, q : p < q)), b |-> (SortSeq(Append(<<>>, 3), LAMBDA p, q : p < q) = ([b13863 \in 2..1 |-> b13863] @@ (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08938 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 171 to line 14, col 206 of module random_08938
---*)
