(*---
description: Evaluates a random record expression, seed 262, number 6705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b10275 == Head(<<>>) IN Head(<<1, 2>>), b |-> ([[a |-> 1] EXCEPT !.a = 7] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2])] EXCEPT !.a = ((CHOOSE r \in [a : 2..1] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06705 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 160 to line 14, col 189 of module random_06705
---*)
