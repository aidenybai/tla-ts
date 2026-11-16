(*---
description: Evaluates a random seq expression, seed 262, number 3532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq([<<3, 1, 2>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b5584 \in {2147483647, 1} : (b5584 < b5584))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03532 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 111 to line 14, col 160 of module random_03532
---*)
