(*---
description: Evaluates a random bool expression, seed 262, number 4330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 7, b |-> FALSE]).a * Len(Tail(<<3, 1, 2>>))) < LET b6819 == Len(SubSeq(<<1>>, 1, 1)) IN (CHOOSE b6820 \in UNION {{2, 1, 3}, {}} : (-1 = b6819))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04330 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 115 to line 14, col 167 of module random_04330
---*)
