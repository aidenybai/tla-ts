(*---
description: Evaluates a random bool expression, seed 262, number 9379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![-1] = 1] \cap DOMAIN (CHOOSE f \in [2..1 -> 1..2] : TRUE)) = (((3 * 1) + (-1 - 7)) .. IF (FALSE /\ FALSE) THEN (2 + 2) ELSE CASE TRUE -> 1 [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 46 of module random_09379
    | FALSE
---*)
