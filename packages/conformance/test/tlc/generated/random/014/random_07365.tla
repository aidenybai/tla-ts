(*---
description: Evaluates a random int expression, seed 262, number 7365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11331 \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) : ([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = (b11331 + b11331)] = [(CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE) EXCEPT ![(b11331 * 2147483647)] = (-b11331)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 169 to line 14, col 213 of module random_07365
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07365 failed.
    2178:0 Overflow when computing 2*2147483647
---*)
