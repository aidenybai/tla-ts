(*---
description: Evaluates a random record expression, seed 262, number 3604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[{x \in 1..3 : x > 1} EXCEPT ![7] = 3] EXCEPT ![IF TRUE THEN 7 ELSE -1] = Cardinality({})]).a, b |-> ((Cardinality({1, 2}) .. (CHOOSE b5686 \in {2, 1, 3} : FALSE)) <=> (\E b5687 \in {{x \in 1..3 : x > 1}, -1} : (TRUE => TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03604 failed.
    Attempted to apply EXCEPT construct to the value {2, 3}.
---*)
