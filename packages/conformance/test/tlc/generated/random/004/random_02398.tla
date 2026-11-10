(*---
description: Evaluates a random bool expression, seed 262, number 2398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[([x \in Nat |-> x + 1])[3] EXCEPT !.a = (3 * 2)] EXCEPT !.a = @ + CASE (\E b3797 \in Nat : TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (CHOOSE b3798 \in {1} : FALSE)] = (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02398 failed.
    Attempted to apply EXCEPT construct to the value 4.
---*)
