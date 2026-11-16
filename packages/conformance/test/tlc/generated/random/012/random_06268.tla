(*---
description: Evaluates a random int expression, seed 262, number 6268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b9651 \in {Cardinality(2..1), (3 % 7)} : ([a |-> b9651, b |-> 1] = [a |-> b9651, b |-> FALSE])) + (-Cardinality((0 .. 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06268 failed.
    Attempted to check equality of integer 1 with non-integer:
    FALSE
---*)
