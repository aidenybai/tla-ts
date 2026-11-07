(*---
description: Evaluates a random bool expression, seed 262, number 548.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00548 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [(1 :> 7) EXCEPT ![IF TRUE THEN 3 ELSE 2147483647] = IF FALSE THEN TRUE ELSE -1] \subseteq (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 31 of module random_00548
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00548 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
