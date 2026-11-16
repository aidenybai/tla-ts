(*---
description: Evaluates a random int expression, seed 262, number 8607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(-(CHOOSE b13331 \in {1} : FALSE))) < Len(Append(SortSeq(<<>>, LAMBDA p, q : p < q), (2147483647 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08607 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 22 to line 14, col 50 of module random_08607
---*)
