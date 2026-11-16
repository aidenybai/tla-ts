(*---
description: Evaluates a random seq expression, seed 262, number 901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b1449 == (Len(<<1>>) - Len(<<1>>)) IN (-(CHOOSE b1450 \in {2, 1, 3} : FALSE)), IF ((2..1 \cup {x \in 1..3 : x > 1}) \subseteq (2 .. 0)) THEN Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) ELSE Len(<<1, FALSE>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00901 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 96 of module random_00901
---*)
