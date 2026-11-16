(*---
description: Evaluates a random bool expression, seed 262, number 8565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\A b13272 \in UNION {1..3, [a |-> 1, b |-> TRUE]} : (<<1, 2>> = <<1>>))) /\ ((([a |-> 1, b |-> TRUE]).a \in {0, 1}) => ((SUBSET {1} \subseteq {1, 2}) /\ ({1} = {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08565 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    1..3
---*)
