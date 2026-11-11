(*---
description: Evaluates a random bool expression, seed 262, number 919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b1480 \in ((SUBSET {1} \cup 2..1) \ {TRUE, 0}) : (~(TRUE /\ TRUE))) => (Len(Tail(<<1>>)) .. Head(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00919 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    {}
---*)
