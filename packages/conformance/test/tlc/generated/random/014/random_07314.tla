(*---
description: Evaluates a random int expression, seed 262, number 7314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([Append([<<1, 2>> EXCEPT ![1] = 0], [[a |-> 1] EXCEPT !.a = 7]) EXCEPT ![1] = (CHOOSE b11263 \in Append(<<>>, 7) : (TRUE \/ [a |-> 1]))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07314 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 100 to line 14, col 154 of module random_07314
---*)
