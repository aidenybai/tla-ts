(*---
description: Evaluates a random set expression, seed 262, number 6873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq([[a |-> 1] EXCEPT ![1] = 2], LAMBDA p, q : p < q) EXCEPT ![1] = (-(1 * 7))] \o Append([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (<<5, 6>>)[1]], (CHOOSE f \in [1..2 -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06873 failed.
    Attempted to access record by a non-string argument: 1
---*)
