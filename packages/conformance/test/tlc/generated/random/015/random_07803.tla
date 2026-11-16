(*---
description: Evaluates a random function expression, seed 262, number 7803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{2, 1, 3} -> {1, 2}] : TRUE) EXCEPT ![Head(((TRUE \/ TRUE) => [<<>> EXCEPT ![1] = -1]))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = CASE TRUE -> -1 [] OTHER -> 2147483647]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 95 to line 14, col 98 of module random_07803
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07803 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a tuple.
    line 14, col 76 to line 14, col 116 of module random_07803
---*)
