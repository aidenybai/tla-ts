(*---
description: Evaluates a random int expression, seed 262, number 5415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b8387 \in {([a |-> 1, b |-> TRUE]).a, (CHOOSE b8388 \in {2, 1, 3} : FALSE)} : (([a |-> 1] = [a |-> 1, b |-> TRUE]) => (b8387 < 2))) - LET b8389 == LET b8390 == (7 * 3) IN Len(<<1>>) IN Head(Append(<<1, 2>>, 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05415 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 97 of module random_05415
---*)
