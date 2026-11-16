(*---
description: Evaluates a random set expression, seed 262, number 4013.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04013 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b6300 \in {b6301 : b6301 \in 1..3} : Len(<<3, 1, 2>>)}) .. Len(<<Head(<<>>), ([a |-> 1, b |-> TRUE]).a>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04013 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 67 to line 14, col 82 of module random_04013
---*)
