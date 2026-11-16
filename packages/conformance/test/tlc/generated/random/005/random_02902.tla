(*---
description: Evaluates a random set expression, seed 262, number 2902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> (1..3 = {}) [] OTHER -> Len(<<>>)] EXCEPT !.a = LET b4594 == ((3 % 1) - Head(1..3)) IN (Cardinality({1, 2}) - LET b4595 == 2147483647 IN 1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02902 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_02902
---*)
