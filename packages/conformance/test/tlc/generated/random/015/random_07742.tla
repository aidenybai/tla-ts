(*---
description: Evaluates a random seq expression, seed 262, number 7742.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07742 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b11944 \in {1, 2} : FALSE)], LAMBDA p, q : p < q) \o (Tail(Append(<<>>, 7)) \o SubSeq([<<1, 2>> EXCEPT ![1] = FALSE], LET b11945 == 3 IN <<5, 6>>, ([x \in Nat |-> x + 1])[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07742 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 108 of module random_07742
---*)
