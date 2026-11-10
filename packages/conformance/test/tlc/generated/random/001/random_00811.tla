(*---
description: Evaluates a random int expression, seed 262, number 811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(SubSeq(SubSeq(<<1>>, 7, 0), CASE TRUE -> Nat [] OTHER -> 2147483647, (CHOOSE b1327 \in 1..3 : FALSE)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00811 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 98 to line 14, col 126 of module random_00811
---*)
