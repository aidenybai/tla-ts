(*---
description: Evaluates a random bool expression, seed 262, number 888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a, b |-> (DOMAIN [x \in Nat |-> x + 1] = (3 .. 3))] = [[a |-> (2 + 0), b |-> (FALSE \/ TRUE)] EXCEPT !.a = ((1 % 3) % CASE TRUE -> -1 [] OTHER -> -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00888 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    3..3
---*)
