(*---
description: Evaluates a random bool expression, seed 262, number 7880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b12165 \in [a |-> 1, b |-> TRUE] |-> b12165])[Cardinality({1})] * ([[a |-> 1] EXCEPT !.a = 3]).a) - IF ((TRUE => TRUE) => (\E b12166 \in {2, 1, 3} : TRUE)) THEN Cardinality(({x \in 1..3 : x > 1} \cap {1, 2})) ELSE LET b12167 == Len(<<1, 2>>) IN ([x \in Nat |-> x + 1])[7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07880 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
