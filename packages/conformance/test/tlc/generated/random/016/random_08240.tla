(*---
description: Evaluates a random bool expression, seed 262, number 8240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (-([a |-> 1]).a), b |-> (\E b12750 \in {[a |-> 1, b |-> TRUE], -1} : (~FALSE))] = (CHOOSE r \in [a : 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08240 failed.
    Attempted to compare integer -1 with non-integer:
    [a |-> 1, b |-> TRUE]
---*)
