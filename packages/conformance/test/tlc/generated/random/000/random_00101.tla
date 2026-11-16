(*---
description: Evaluates a random record expression, seed 262, number 101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (CHOOSE b157 \in (3 .. 0) : (b157 = b157))] EXCEPT !.a = Len(Append(Append(<<1, 2>>, 1), (0 + -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00101 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 74 to line 14, col 113 of module random_00101
---*)
