(*---
description: Evaluates a random int expression, seed 262, number 1602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a, ([b2558 \in {1} |-> b2558])[[a |-> 1, b |-> FALSE]]} * Cardinality({([a |-> 1]).a : b2559 \in {b2560 \in {x \in 1..3 : x > 1} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01602 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1, b |-> FALSE]
---*)
