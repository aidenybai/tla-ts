(*---
description: Evaluates a random int expression, seed 262, number 6749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([{7, 1} EXCEPT !.a = @ + (7 \div 2147483647)]).a \div Cardinality({([a |-> 1, b |-> TRUE]).a, Len(<<1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06749 failed.
    Attempted to apply EXCEPT construct to the value {1, 7}.
---*)
