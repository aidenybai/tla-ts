(*---
description: Evaluates a random seq expression, seed 262, number 3446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (-1 - 1)], Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03446 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 52 of module random_03446
---*)
