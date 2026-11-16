(*---
description: Evaluates a random bool expression, seed 262, number 995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE b1594 \in {} : TRUE)] EXCEPT !.a = ((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE))[(CHOOSE b1595 \in {} : FALSE)]] = (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00995 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 69 to line 14, col 94 of module random_00995
---*)
