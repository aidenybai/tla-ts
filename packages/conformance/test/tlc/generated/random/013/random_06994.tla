(*---
description: Evaluates a random int expression, seed 262, number 6994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[((Len(<<3, 1, 2>>) + ([a |-> 1, b |-> TRUE]).a) - Cardinality({7, 3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06994 failed.
    Attempted to apply function:
    <<0>>
    to argument 2, which is not in the domain of the function.
---*)
