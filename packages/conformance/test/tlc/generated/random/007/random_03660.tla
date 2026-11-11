(*---
description: Evaluates a random int expression, seed 262, number 3660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b5785 \in ({1, 2} \cup {2, 1, 3}) : (b5785 = b5785)) % (-((1 :> 2))[1])) % Cardinality({(b5786 * 7) : b5786 \in UNION {{}, {1, 2}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03660 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2
---*)
