(*---
description: Evaluates a random set expression, seed 262, number 3538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE), {Len(<<3, 2>>), Cardinality({b5593 : b5593 \in [a |-> 1]})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03538 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1].
    line 14, col 120 to line 14, col 128 of module random_03538
---*)
