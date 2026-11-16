(*---
description: Evaluates a random seq expression, seed 262, number 1239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail([[<<1, 2>> EXCEPT ![1] = 0] EXCEPT ![1] = (CHOOSE r \in [a : {1, 2}] : TRUE)]) \o SubSeq([Append(<<3, 1, 2>>, 3) EXCEPT ![1] = (CHOOSE b1987 \in {1, 2} : FALSE)], (([a |-> 1, b |-> TRUE]).a * (-1 * 7)), (-(1 + 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01239 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 150 to line 14, col 180 of module random_01239
---*)
