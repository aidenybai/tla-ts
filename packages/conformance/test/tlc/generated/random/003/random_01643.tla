(*---
description: Evaluates a random function expression, seed 262, number 1643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(TRUE)) % (([a |-> 1]).a - (2 + 0))) :> (Cardinality(DOMAIN [a |-> 1, b |-> TRUE]) - IF (\E b2630 \in {} : TRUE) THEN (-0) ELSE Cardinality(Nat))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    TRUE
---*)
