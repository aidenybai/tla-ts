(*---
description: Evaluates a random function expression, seed 262, number 509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (\A b847 \in SUBSET {1} : FALSE) -> Cardinality({1, 2}) [] OTHER -> ([a |-> 1, b |-> TRUE]).a % ((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[(~TRUE)]) :> ([a |-> CASE TRUE -> Nat [] OTHER -> 3, b |-> (3 \in {})]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00509 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
