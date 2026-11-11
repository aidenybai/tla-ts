(*---
description: Evaluates a random bool expression, seed 262, number 325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~({} \in {1})) \/ ((0 - 7) < (2 * 0))) \/ (((TRUE \/ TRUE) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1])) /\ (<<<<5, 6>>, 1>> = [b545 \in 1..3 |-> 0]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00325 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
