(*---
description: Evaluates a random set expression, seed 262, number 8851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13711 \in Cardinality(Append(<<1, 2>>, 3)) : (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) \/ (TRUE \/ FALSE))} \ (IF (1 % 2) THEN (CHOOSE b13712 \in 1..3 : FALSE) ELSE Cardinality({1, 2}) .. ((CHOOSE f \in [{} -> 1..2] : TRUE))[IF TRUE THEN 2 ELSE 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08851 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1, 2, 3>>
---*)
