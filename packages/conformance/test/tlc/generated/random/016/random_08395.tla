(*---
description: Evaluates a random bool expression, seed 262, number 8395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((Cardinality({2, 1, 3}) % Head(<<>>)) \in {b12994 \in ({} \cup {2, 1, 3}) : (FALSE => b12994)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
