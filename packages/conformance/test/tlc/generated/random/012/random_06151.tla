(*---
description: Evaluates a random bool expression, seed 262, number 6151.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06151 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~({2147483647, [a |-> 1]} = {b9461 : b9461 \in 2..1})) /\ (([[a |-> 1] EXCEPT !.a = @ + 2147483647]).a = ((2147483647 + 2147483647) % LET b9462 == FALSE IN b9462))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06151 failed.
    Attempted to compare record:
    [a |-> 1]
    with non-record
    2147483647
---*)
