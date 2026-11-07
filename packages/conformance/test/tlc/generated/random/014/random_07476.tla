(*---
description: Evaluates a random int expression, seed 262, number 7476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b11517 \in ((1 \cap {1, 2}) \cap {0 : b11518 \in {x \in 1..3 : x > 1}}) : ([[a |-> 1] EXCEPT !.a = @ + 2147483647] = [a |-> b11517, b |-> TRUE])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07476 failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
