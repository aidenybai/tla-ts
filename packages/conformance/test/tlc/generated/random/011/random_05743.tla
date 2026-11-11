(*---
description: Evaluates a random set expression, seed 262, number 5743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = @ + (-2147483647)] EXCEPT !.a = @ + IF (Nat = {}) THEN (3 * {1}) ELSE Cardinality(Nat)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05743 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
