(*---
description: Evaluates a random int expression, seed 262, number 3378.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03378 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len(SelectSeq(<<1>>, LAMBDA e : e > 0))) * Cardinality([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (~TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> FALSE]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> FALSE]
---*)
