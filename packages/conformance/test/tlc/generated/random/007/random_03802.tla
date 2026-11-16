(*---
description: Evaluates a random bool expression, seed 262, number 3802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA p, q : p < q) = [([[a |-> 1] EXCEPT !.a = -1]).a EXCEPT ![IF (3 = 7) THEN (7 - -1) ELSE (CHOOSE b5996 \in {2, 1, 3} : FALSE)] = Len(SubSeq(<<1, 2>>, <<1, 2>>, 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03802 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 186 to line 14, col 219 of module random_03802
---*)
