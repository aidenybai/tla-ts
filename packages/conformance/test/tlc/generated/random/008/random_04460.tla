(*---
description: Evaluates a random seq expression, seed 262, number 4460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append([[<<>> EXCEPT ![1] = 1] EXCEPT ![1] = (1..3 \cap {1})], Cardinality(UNION {{1, 2}, {1}})), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 33 to line 14, col 36 of module random_04460
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 53 of module random_04460
    | <<2>>
---*)
