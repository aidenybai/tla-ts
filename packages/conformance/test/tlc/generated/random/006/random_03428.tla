(*---
description: Evaluates a random seq expression, seed 262, number 3428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(Nat)], LAMBDA p, q : p < q) EXCEPT ![1] = (-((<<5, 6>>)[7] \div Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 58 of module random_03428
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 112 of module random_03428
    | <<>>
---*)
