(*---
description: Evaluates a random bool expression, seed 262, number 4102.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04102 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 * 1) \in ({1} \cup [a |-> 1, b |-> TRUE])) \/ ((-1 /\ TRUE) => (1 = 0))) /\ (\A b6444 \in (([a |-> 1, b |-> TRUE]).a .. Head(<<1>>)) : ({3, b6444} \subseteq {b6444 : b6445 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04102 failed.
    Attempted to check if element:
    -1
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
