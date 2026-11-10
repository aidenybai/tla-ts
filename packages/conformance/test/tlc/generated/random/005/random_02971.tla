(*---
description: Evaluates a random bool expression, seed 262, number 2971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 % 1))[(-1 \div 2147483647)] = ([a |-> 2, b |-> TRUE]).a) <=> (~((TRUE /\ FALSE) => (TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02971 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 18 to line 14, col 57 of module random_02971
---*)
