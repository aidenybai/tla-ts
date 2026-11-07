(*---
description: Evaluates a random seq expression, seed 262, number 5224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<Head([<<>> EXCEPT ![1] = 2147483647]), (Len(<<1>>) % Cardinality(2..1))>> EXCEPT ![1] = ((Cardinality({1, 2}) + Len(<<1>>)) + Head([a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 28 of module random_05224
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
