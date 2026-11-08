(*---
description: Evaluates a random bool expression, seed 262, number 6167.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06167 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(UNION {{2, 1, 3}, 2..1}) * Len(Append(-1, 2))) \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06167 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    -1
---*)
