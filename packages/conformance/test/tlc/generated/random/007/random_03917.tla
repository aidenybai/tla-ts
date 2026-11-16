(*---
description: Evaluates a random set expression, seed 262, number 3917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-IF (<<1, 2>> = <<5, 6>>) THEN Cardinality({1, 2}) ELSE (b6178 + 2)) : b6178 \in (\A b6179 \in (([a |-> 1, b |-> TRUE] \cap 2..1) \ {b6180 \in {} : TRUE}) : ((b6179 \in Nat) => (\E b6181 \in SUBSET {1} : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03917 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 100 to line 14, col 227 of module random_03917
---*)
