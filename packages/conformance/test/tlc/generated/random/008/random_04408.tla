(*---
description: Evaluates a random bool expression, seed 262, number 4408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(Head(<<3, 1, 2>>) = ([a |-> 1]).a)) => ((CHOOSE r \in [a : 2..1] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = (2 - 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04408 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 61 to line 14, col 90 of module random_04408
---*)
