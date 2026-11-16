(*---
description: Evaluates a random bool expression, seed 262, number 2792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4422 \in {b4423 \in ({x \in 1..3 : x > 1} \cap 1..3) : (\E b4424 \in SUBSET {1} : FALSE)} : ([a |-> b4422, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = b4422])} = (CHOOSE f \in [{} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02792 failed.
    Attempted to check equality of the set {} with the value:
    <<>>
---*)
