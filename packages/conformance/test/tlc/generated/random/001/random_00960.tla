(*---
description: Evaluates a random function expression, seed 262, number 960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq([<<1>> EXCEPT ![1] = 3], LAMBDA e : e > 0), (-(CHOOSE b1550 \in {1, 2} : TRUE))) :> (CHOOSE b1551 \in ({b1552 : b1552 \in {2, 1, 3}} \ {b1553 : b1553 \in 1..3}) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + FALSE] = [[a |-> 1] EXCEPT !.a = b1551]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00960 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 119 to line 14, col 277 of module random_00960
---*)
