(*---
description: Evaluates a random set expression, seed 262, number 8946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({Head(<<1>>), ([a |-> 1, b |-> TRUE]).a}) :> ((CHOOSE f \in [{1} -> {1}] : TRUE))[Cardinality({b13883 : b13883 \in 1..3})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08946 failed.
    Attempted to apply function:
    <<1>>
    to argument 3, which is not in the domain of the function.
---*)
