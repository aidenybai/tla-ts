(*---
description: Evaluates a random function expression, seed 262, number 9039.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({2, 2147483647}) \div IF (TRUE <=> TRUE) THEN Len(<<1>>) ELSE (2 \div <<5, 6>>)) @@ (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09039 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    2
---*)
