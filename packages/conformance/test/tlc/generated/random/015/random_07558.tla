(*---
description: Evaluates a random set expression, seed 262, number 7558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b11638 \in (1..3 \cup Nat) : (TRUE => TRUE)} \ {(CHOOSE b11639 \in {2, 1, 3} : TRUE), (CHOOSE b11640 \in {} : FALSE)}) \ (Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) .. Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07558 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 106 to line 14, col 133 of module random_07558
---*)
