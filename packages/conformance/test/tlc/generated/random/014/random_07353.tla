(*---
description: Evaluates a random record expression, seed 262, number 7353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 \cup {2, 1, 3}) \cup {b11316 : b11316 \in {1, 2}}), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] * Head(<<>>))] EXCEPT !.a = @ + (Cardinality(DOMAIN [x \in Nat |-> x + 1]) * (([a |-> 1, b |-> TRUE]).a - IF FALSE THEN 2 ELSE 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07353 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
