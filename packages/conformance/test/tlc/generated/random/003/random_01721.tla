(*---
description: Evaluates a random bool expression, seed 262, number 1721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(~((TRUE <=> TRUE) /\ [a |-> 2, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01721 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a record.
    line 14, col 21 to line 14, col 61 of module random_01721
---*)
