(*---
description: Evaluates a random record expression, seed 262, number 7121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[{2, 1, 3} EXCEPT !.a = @ + -1] EXCEPT !.a = LET b10935 == 2 IN b10935] EXCEPT !.a = (CASE FALSE -> 3 [] OTHER -> -1 + Cardinality({1, 2}))] EXCEPT !.a = @ + ([a |-> ([a |-> 1]).a, b |-> (-1 < -1)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07121 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
