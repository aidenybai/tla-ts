(*---
description: Evaluates a random bool expression, seed 262, number 3113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Head(<<>>)) + LET b4970 == (1 \div 7) IN LET b4971 == 1 IN b4970) < (LET b4972 == (2147483647 + 7) IN ([a |-> 1]).a % (CHOOSE b4973 \in ({1} \subseteq 2..1) : (b4973 = b4973)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03113 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
