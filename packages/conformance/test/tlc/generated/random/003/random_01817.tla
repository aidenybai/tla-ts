(*---
description: Evaluates a random function expression, seed 262, number 1817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (1 - 1)] EXCEPT !.a = @ + ([[x \in 1..2 |-> x] EXCEPT ![-1] = 1])[Head(<<1, 2>>)]] @@ (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 91 to line 14, col 108 of module random_01817
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01817 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 150 to line 14, col 191 of module random_01817
---*)
