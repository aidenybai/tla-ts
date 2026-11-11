(*---
description: Evaluates a random bool expression, seed 262, number 8569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~([a |-> 1, b |-> TRUE] = {1, 2})) /\ ((-1 \in {2, 1, 3}) \/ (1..3 \subseteq 1..3))) => (\E b13279 \in (([x \in 1..2 |-> x])[2147483647] .. LET b13280 == [a |-> 1, b |-> TRUE] IN 3) : ((FALSE <=> FALSE) => ({1, 2} = {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08569 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    {1, 2}
---*)
