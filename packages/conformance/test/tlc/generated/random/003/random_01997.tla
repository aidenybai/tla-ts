(*---
description: Evaluates a random int expression, seed 262, number 1997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(3 + 3) : b3164 \in {b3165 : b3165 \in {2, 1, 3}}}) % Len(SubSeq(Tail(<<>>), Head(<<1>>), ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01997 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
