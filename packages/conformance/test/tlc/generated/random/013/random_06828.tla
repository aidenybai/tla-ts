(*---
description: Evaluates a random bool expression, seed 262, number 6828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~([a |-> 1, b |-> TRUE] = {2, 1, 3})) \/ ((~FALSE) /\ (\A b10462 \in {1} : FALSE))) <=> [[a |-> (-1), b |-> (2 \in 1..3)] EXCEPT !.a = {b10463 \in (Nat \ [x \in 1..2 |-> x]) : (b10463 \in 1..3)}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06828 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {1, 2, 3}
---*)
