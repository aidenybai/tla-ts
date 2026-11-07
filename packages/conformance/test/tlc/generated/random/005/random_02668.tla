(*---
description: Evaluates a random bool expression, seed 262, number 2668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) = LET b4212 == (CHOOSE b4213 \in (2..1 \cap {1, 2}) : ([a |-> 1] = [a |-> 1])) IN ([(1 :> 2) EXCEPT ![2] = 2])[LET b4214 == b4212 IN b4214]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 151 to line 14, col 156 of module random_02668
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02668 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 142 of module random_02668
---*)
