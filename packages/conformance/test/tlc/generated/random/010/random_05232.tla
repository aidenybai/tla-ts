(*---
description: Evaluates a random int expression, seed 262, number 5232.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05232 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(DOMAIN ((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) @@ [2..1 EXCEPT !.a = 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05232 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
