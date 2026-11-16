(*---
description: Evaluates a random bool expression, seed 262, number 9968.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09968 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b15492 == ([a |-> 1, b |-> TRUE]).a IN LET b15493 == 7 IN b15493 * (CHOOSE b15494 \in UNION {SUBSET {1}, {1}} : (3 = b15494))) = (CHOOSE b15495 \in UNION {([a |-> 1, b |-> TRUE] \cap {1, 2}), (1 .. -1)} : ((2 * b15495) \in {b15496 \in 1..3 : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09968 failed.
    Attempted to compare the set {} with the value:
    1
---*)
