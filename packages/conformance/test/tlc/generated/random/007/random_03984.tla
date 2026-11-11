(*---
description: Evaluates a random set expression, seed 262, number 3984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = Tail(<<3, 1, 2>>)]).a, LET b6269 == LET b6270 == (0 \div 2) IN (3 * 2) IN (CHOOSE b6271 \in {b6272 \in {1, 2} : FALSE} : (1 = 2147483647))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03984 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 146 to line 14, col 207 of module random_03984
---*)
