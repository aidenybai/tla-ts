(*---
description: Evaluates a random function expression, seed 262, number 2564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) @@ Cardinality((UNION {{2, 1, 3}, 1..3} \cap {-1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    1
    2169:0 The second argument of @@ should be a function, but instead it is:
    1
---*)
