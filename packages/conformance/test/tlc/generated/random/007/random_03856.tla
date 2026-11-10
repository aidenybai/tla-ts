(*---
description: Evaluates a random bool expression, seed 262, number 3856.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03856 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 % 2147483647) :> ({2, 1, 3} \subseteq {}))).a \in ((\A b6076 \in ({1, 2} \ {1}) : (TRUE /\ TRUE)) \cup ([[a |-> 1] EXCEPT !.a = -1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03856 failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
